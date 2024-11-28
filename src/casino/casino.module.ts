import { Module } from '@nestjs/common';
import { CasinoService } from './casino.service';
import { CasinoController } from './casino.controller';

@Module({
  controllers: [CasinoController],
  providers: [CasinoService],
})
export class CasinoModule {}
