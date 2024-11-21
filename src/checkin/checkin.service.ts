import { HttpException, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/types/user.types';
// import { CreateCheckinDto } from './dto/create-checkin.dto';
// import { UpdateCheckinDto } from './dto/update-checkin.dto';

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService) {}

  private getReward(day: number): number {
    const rewards = [
      100, 200, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000,
    ];
    return day > 10 ? rewards[rewards.length - 1] : rewards[day - 1];
  }

  async checkin(user: User): Promise<any> {
    // 确认用户今天是否已经签到
    const today = dayjs().startOf('day');
    const existingRecord = await this.prisma.checkInRecord.findFirst({
      where: {
        userId: user.user.id,
        createdAt: {
          gte: today.toDate(),
        },
      },
    });

    if (existingRecord) {
      throw new HttpException('You have already checked in today.', 400);
    }

    // 获取用户最后一次签到记录
    const lastRecord = await this.prisma.checkInRecord.findFirst({
      where: { userId: user.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // 计算连续签到天数
    const lastDate = lastRecord ? dayjs(lastRecord.createdAt) : null;
    const isConsecutive = lastDate
      ? today.subtract(1, 'day').isSame(lastDate, 'day')
      : false;
    const nextDay = isConsecutive ? lastRecord.day + 1 : 1;
    const reward = this.getReward(nextDay);

    // 创建签到记录
    const [record] = await this.prisma.$transaction(async (prisma) => {
      return await Promise.all([
        prisma.checkInRecord.create({
          data: {
            userId: user.user.id,
            day: nextDay,
          },
        }),
        // TODO: 增加用户资产
        prisma.asset.update({
          where: {
            userId_type: {
              userId: user.user.id,
              type: 'jack',
            },
          },
          data: {
            amount: {
              increment: reward,
            },
          },
        }),
      ]);
    });

    return { ...record, reward };
  }

  async getCheckin(user: User): Promise<any> {
    // 获取用户连续签到天数
    return await this.prisma.checkInRecord.findFirst({
      where: { userId: user.user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* create(createCheckinDto: CreateCheckinDto) {
    return 'This action adds a new checkin';
  }

  findAll() {
    return `This action returns all checkin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} checkin`;
  }

  update(id: number, updateCheckinDto: UpdateCheckinDto) {
    return `This action updates a #${id} checkin`;
  }

  remove(id: number) {
    return `This action removes a #${id} checkin`;
  } */
}
