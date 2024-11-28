import { Injectable } from '@nestjs/common';
import { Casino } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CasinoService {
  constructor(private readonly prisma: PrismaService) {}

  // 获取所有赌场信息
  async findAll(): Promise<Casino[]> {
    return await this.prisma.casino.findMany();
  }

  // 根据 ID 查询具体赌场
  async findOne(id: string): Promise<Casino | null> {
    return this.prisma.casino.findUnique({
      where: {
        id,
      },
    });
  }
}
