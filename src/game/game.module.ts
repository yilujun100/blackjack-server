import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { AssetService } from 'src/asset/asset.service';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [GameGateway, GameService, AssetService, UserService],
})
export class GameModule {}
