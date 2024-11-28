import { Inject, Injectable, Logger } from '@nestjs/common';
import { Casino } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CasinoService {
  private readonly logger = new Logger(CasinoService.name);
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // 获取所有赌场信息
  async findAll(): Promise<Casino[]> {
    // return await this.prismaService.casino.findMany();
    const casinos: Casino[] | null = await this.cacheManager.get('casinos');
    if (!casinos) {
      this.logger.log('Cache miss');
      return await this.prismaService.casino.findMany();
    }
    return casinos;
  }

  // 定时任务, 每 1 小时会从数据库中查询赌场数据并同步到 Redis
  @Cron('0 0 0 * * *')
  async syncCache() {
    this.logger.log('Syncing cache');
    const casinos = await this.prismaService.casino.findMany();
    await this.cacheManager.set('casinos', casinos);
  }

  // 根据 ID 查询具体赌场
  async findOne(id: string): Promise<Casino | null> {
    return this.prismaService.casino.findUnique({
      where: {
        id,
      },
    });
  }
}
