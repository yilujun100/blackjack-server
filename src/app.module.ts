import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './middleware/auth.middleware';
import { UserService } from './user/user.service';
import { CheckinModule } from './checkin/checkin.module';
import { TaskModule } from './task/task.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DistributedLockModule } from './common/distributed-lock/distributed-lock.module';
import { CassandraModule } from './common/cassandra/cassandra.module';
import { AssetModule } from './asset/asset.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CasinoModule } from './casino/casino.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL,
        }),
      }),
    }),
    ScheduleModule.forRoot(),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
    }),
    DistributedLockModule,
    PrismaModule,
    UserModule,
    CheckinModule,
    TaskModule,
    CassandraModule,
    AssetModule,
    CasinoModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'user', method: RequestMethod.POST })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
