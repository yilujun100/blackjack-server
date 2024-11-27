import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssetService } from 'src/asset/asset.service';
import { CheckinService } from 'src/checkin/checkin.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, PrismaService, AssetService, CheckinService],
})
export class TaskModule {}
