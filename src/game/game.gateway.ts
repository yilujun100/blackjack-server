import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { GameService } from './game.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/types/user.types';
import { Socket } from 'net';
import { Server } from 'http';
import { WsAuthGuard } from 'src/common/middlewares/ws-auth.guard';
import { UseGuards } from '@nestjs/common';
import { PlayerActionDto } from './dto/player-action.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join')
  join(@CurrentUser() user: User, @MessageBody('level') level: number) {
    return this.gameService.join(user, this.server, level);
  }

  @SubscribeMessage('leave')
  leave() {}

  @SubscribeMessage('end')
  end() {}

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('playerAction')
  playerAction(
    @CurrentUser() user: User,
    @MessageBody() playerActionDto: PlayerActionDto,
  ) {
    return this.gameService.playerAction(user, this.server, playerActionDto);
  }
}
