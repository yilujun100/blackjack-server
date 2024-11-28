import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Socket } from 'net';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AssetService } from 'src/asset/asset.service';
import { PlayerActionDto } from './dto/player-action.dto';
import { Type } from 'src/asset/dto/transfer.dto';
import { SYSTEM_BET_ID } from 'src/common/constance';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private readonly assetService: AssetService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async join(user: User, client: Socket, level: number) {
    const casino = await this.getCasino(level);
    if (!casino) {
      return this.errorResponse('No such casino');
    }

    if (!this.isUserEligible(user, casino)) {
      return this.errorResponse('Not enough money');
    }
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

  private startBetCountdown(client: Socket, user: User) {
    let timeLeft = 10;
    const interval = setInterval(() => {
      client.emit('bet-countdown', { timeLeft });
      if (--timeLeft <= 0) {
        clearInterval(interval);
        this.kick(user, client);
      }
    }, 1000);
    client['interval'] = interval;
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

  private async kick(user: User, client: Socket) {
    const room = await this.prisma.room.findFirst({
      where: { players: { hasSome: [user.user.id] }, status: 'waiting' },
    });
    if (!room) {
      client.emit('kick', {
        message: 'You are not in any room',
        status: 'error',
      });
    }
    await this.prisma.room.update({
      where: { id: room.id },
      data: { players: room.players.filter((id) => id !== user.user.id) },
    });
    client.emit('kick', { message: 'You have been kicked', status: 'success' });
  }

  async playerAction(
    user: User,
    client: Socket,
    playerActionDto: PlayerActionDto,
  ) {
    switch (playerActionDto.type) {
      case 'bet':
        return this.bet(user, client, playerActionDto);
    }
  }

  async bet(user: User, client: Socket, playerActionDto: PlayerActionDto) {
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

    clearInterval(client['interval']);
    client.emit('playerAction', { message: 'Bet success', status: 'success' });
    client.emit('start', { message: 'Game start', status: 'success' });

    await this.generateDeck(room.id, room.players);

    const playerCards = await this.dealCards(room.id, user.user.id, client);
    client.emit('actions', {
      data:
        playerCards[user.user.id][0] === playerCards[user.user.id][1]
          ? ['split']
          : ['hit', 'stand', 'double', 'surrender'],
    });
  }

  private async dealCards(roomId: string, playerId: string, client: Socket) {
    const delay = (ms: number) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const playerCard1 = await this.deal(roomId, true, playerId);
    client.emit('deal', { isPlayer: true, playerId, card: playerCard1 });
    await delay(500);

    await this.deal(roomId, false);
    client.emit('deal', { isPlayer: false, card: '0' });
    await delay(500);

    const playerCard2 = await this.deal(roomId, true, playerId);
    client.emit('deal', { isPlayer: true, playerId, card: playerCard2 });
    await delay(500);

    const dealerCard2 = await this.deal(roomId, false);
    client.emit('deal', { isPlayer: false, card: dealerCard2 });

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
