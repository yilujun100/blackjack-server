import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';

@Module({
  controllers: [CheckinController],
  providers: [CheckinService],
})
export class CheckinModule {}
