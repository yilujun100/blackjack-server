import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Socket } from 'net';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AssetService } from 'src/asset/asset.service';
import { PlayerActionDto } from './dto/player-action.dto';
import { Type } from 'src/asset/dto/transfer.dto';
import { SYSTEM_BET_ID } from 'src/common/constance';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Server } from 'http';

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private readonly assetService: AssetService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async join(user: User, server: Server, level: number) {
    const casino = await this.getCasino(level);
    if (!casino) {
      return this.errorResponse('No such casino');
    }

    if (!this.isUserEligible(user, casino)) {
      return this.errorResponse('Not enough money');
    }

    const room = await this.getOrCreateRoom(level, user);
    this.startBetCountdown(server, user);
    server.emit('join', {
      status: 'success',
      message: `You have joined ${room.id}`,
    });
    return this.successResponse(`You have joined ${room.id}`);
  }

  private async getCasino(level: number) {
    return await this.prisma.casino.findUnique({ where: { level } });
  }

  private isUserEligible(user: User, casino: any) {
    return user.asset.amount >= casino.minBet;
  }

  private errorResponse(message: string) {
    return { message, status: 'error' };
  }

  private successResponse(message: string) {
    return { message, status: 'success' };
  }

  private startBetCountdown(server: Server, user: User) {
    let timeLeft = 10;
    const interval = setInterval(() => {
      server.emit('bet-countdown', { timeLeft });
      if (--timeLeft <= 0) {
        clearInterval(interval);
        this.kick(user, server);
      }
    }, 1000);
    server['interval'] = interval;
  }

  private async getOrCreateRoom(level: number, user: User) {
    const room = await this.prisma.room.findFirst({
      where: { level, status: 'waiting' },
      orderBy: { createdAt: 'asc' },
    });
    if (room) {
      await this.prisma.room.update({
        where: { id: room.id },
        data: { players: room.players.concat(user.user.id) },
      });
      return room;
    }
    return await this.prisma.room.create({
      data: {
        level,
        status: 'waiting',
        players: [user.user.id],
      },
    });
  }

  private async kick(user: User, server: Server) {
    const room = await this.prisma.room.findFirst({
      where: { players: { hasSome: [user.user.id] }, status: 'waiting' },
    });
    if (!room) {
      server.emit('kick', {
        message: 'You are not in any room',
        status: 'error',
      });
    }
    await this.prisma.room.update({
      where: { id: room.id },
      data: { players: room.players.filter((id) => id !== user.user.id) },
    });
    server.emit('kick', { message: 'You have been kicked', status: 'success' });
  }

  async playerAction(
    user: User,
    server: Server,
    playerActionDto: PlayerActionDto,
  ) {
    switch (playerActionDto.type) {
      case 'bet':
        return this.bet(user, server, playerActionDto);
      case 'hit':
        return this.hit(user, server);
    }
  }

  async bet(user: User, server: Server, playerActionDto: PlayerActionDto) {
    const { amount } = playerActionDto.data;

    if (user.asset.amount < amount) {
      return this.errorResponse('Not enough money');
    }

    const room = await this.prisma.room.findFirst({
      where: { players: { hasSome: [user.user.id] }, status: 'waiting' },
    });
    if (!room) {
      return this.errorResponse('You are not in any room');
    }

    const casino = await this.prisma.casino.findUnique({
      where: { level: room.level },
    });
    if (!casino) {
      return this.errorResponse('No such casino');
    }

    if (amount < casino.minBet || amount > casino.maxBet) {
      return this.errorResponse('Bet amount out of range');
    }

    await this.prisma.$transaction(async (prisma) => {
      const systemBetAsset = await prisma.asset.findUnique({
        where: { userId_type: { userId: SYSTEM_BET_ID, type: 'jack' } },
      });

      await Promise.all([
        prisma.room.update({
          where: { id: room.id },
          data: { status: 'playing' },
        }),
        this.assetService.transfer(
          {
            from_user_id: user.user.id,
            to_user_id: SYSTEM_BET_ID,
            fromVersion: user.asset.version,
            toVersion: systemBetAsset.version,
            token: 'jack',
            amount,
            type: Type.Bet,
            remark: 'bet',
          },
          prisma,
        ),
      ]);
    });

    clearInterval(server['interval']);
    server.emit('playerAction', { message: 'Bet success', status: 'success' });
    server.emit('start', { message: 'Game start', status: 'success' });

    await this.generateDeck(room.id, room.players);

    const playerCards = await this.dealCards(room.id, user.user.id, server);
    server.emit('actions', {
      data:
        playerCards[user.user.id][0] === playerCards[user.user.id][1]
          ? ['split']
          : ['hit', 'stand', 'double', 'surrender'],
    });
  }

  async hit(user: User, server: Server) {
    const room = await this.prisma.room.findFirst({
      where: { players: { hasSome: [user.user.id] }, status: 'playing' },
    });
    if (!room) {
      return this.errorResponse('You are not in any  room');
    }

    const card = await this.deal(room.id, true, user.user.id);
    server.emit('deal', {
      isPlayer: true,
      playerId: user.user.id,
      card,
    });
    const result = await this.checkBustOrBlackjack(room.id, user.user.id);
    const playerScore = this.calculateTotal(
      await this.cacheManager.get<string[]>(`hand:${room.id}:${user.user.id}`),
    );
    const dealerScore = this.calculateTotal(
      await this.cacheManager.get<string[]>(`hand:${room.id}:dealer`),
    );
    console.log('game result: ', result, playerScore, dealerScore);
    if (result === 'bust') {
      await this.gameover(
        room.id,
        user,
        server,
        'bust',
        playerScore,
        dealerScore,
      );
      return;
    }
    if (result === 'blackjack') {
      await this.gameover(room.id, user, server, 'blackjack', 21, dealerScore);
      return;
    }
    server.emit('actions', { data: ['hit', 'stand'] });
  }

  private async checkBustOrBlackjack(roomId: string, playerId: string) {
    const handCards = await this.cacheManager.get<string[]>(
      `hand:${roomId}:${playerId}`,
    );
    const total = this.calculateTotal(handCards);
    if (total === 21) {
      return 'blackjack';
    }
    if (total > 21) {
      return 'bust';
    }
    return 'continue';
  }

  private calculateTotal(handCards: string[]) {
    let total = 0;
    let aceCount = 0;
    for (const card of handCards) {
      if (card === 'A') {
        aceCount++;
        total += 11;
      } else if (['J', 'Q', 'K'].includes(card)) {
        total += 10;
      } else {
        total += Number(card);
      }
    }
    while (total > 21 && aceCount > 0) {
      total -= 10;
      aceCount--;
    }
    return total;
  }

  private async gameover(
    roomId: string,
    user: User,
    server: Server,
    status: 'bust' | 'blackjack' | 'win' | 'lose',
    playerScore: number,
    dealerScore: number,
  ) {
    if (status === 'blackjack' || status === 'win') {
      // 将筹码转给玩家
      const betAmount = server['bet-amount'];
      await this.prisma.$transaction(async (prisma) => {
        const systemBetAsset = await prisma.asset.findUnique({
          where: { userId_type: { userId: SYSTEM_BET_ID, type: 'jack' } },
        });
        await this.assetService.transfer(
          {
            from_user_id: SYSTEM_BET_ID,
            to_user_id: user.user.id,
            fromVersion: systemBetAsset.version,
            toVersion: user.asset.version,
            token: 'jack',
            amount: betAmount * 2,
            type: Type.Win,
            remark: 'win',
          },
          prisma,
        );
      });
    }
    await Promise.all([
      server.emit('game-over', { data: status }),
      this.cacheManager.del(`hand:${roomId}:dealer`),
      this.cacheManager.del(`hand:${roomId}:${user.user.id}`),
    ]);
  }

  private async dealCards(roomId: string, playerId: string, server: Server) {
    const delay = (ms: number) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const playerCard1 = await this.deal(roomId, true, playerId);
    server.emit('deal', { isPlayer: true, playerId, card: playerCard1 });
    await delay(500);

    await this.deal(roomId, false);
    server.emit('deal', { isPlayer: false, card: '0' });
    await delay(500);

    const playerCard2 = await this.deal(roomId, true, playerId);
    server.emit('deal', { isPlayer: true, playerId, card: playerCard2 });
    await delay(500);

    const dealerCard2 = await this.deal(roomId, false);
    server.emit('deal', { isPlayer: false, card: dealerCard2 });

    return {
      [playerId]: [playerCard1, playerCard2],
      dealerCard: ['0', dealerCard2],
    };
  }

  async generateDeck(roomId: string, playerIds: string[]) {
    const deck = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 1; j <= 13; j++) {
        deck.push(
          j === 1
            ? 'A'
            : j === 11
              ? 'J'
              : j === 12
                ? 'Q'
                : j === 13
                  ? 'K'
                  : String(j),
        );
      }
    }
    await Promise.all([
      this.cacheManager.set(`deck:${roomId}:used`, []),
      this.cacheManager.set(`deck:${roomId}:unused`, deck),
      this.cacheManager.set(`hand:${roomId}:dealer`, []),
      ...playerIds.map((playerId) => {
        this.cacheManager.set(`hand:${roomId}:${playerId}`, []);
      }),
    ]);
  }

  async deal(roomId: string, isPlayer: boolean, playerId?: string) {
    const [unusedDeck] = await Promise.all([
      this.cacheManager.get<string[]>(`deck:${roomId}:unused`),
    ]);
    // 手牌
    const handCards = await (isPlayer
      ? this.cacheManager.get<string[]>(`hand:${roomId}:${playerId}`)
      : this.cacheManager.get<string[]>(`hand:${roomId}:dealer`));
    if (!unusedDeck) {
      return;
    }
    // 随机抽取一张牌
    const idx = Math.floor(Math.random() * unusedDeck.length);
    const card = unusedDeck[idx];
    await Promise.all([
      this.cacheManager.set(`deck:${roomId}:unused`, unusedDeck),
      this.cacheManager.set(
        isPlayer ? `hand:${roomId}:${playerId}` : `hand:${roomId}:dealer`,
        handCards.concat(card),
      ),
    ]);
    return card;
  }
}
