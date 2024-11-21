import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './middleware/auth.middleware';
import { UserService } from './user/user.service';
import { CheckinModule } from './checkin/checkin.module';
import { TaskModule } from './task/task.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DistributedLockModule } from './common/distributed-lock/distributed-lock.module';

@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
    }),
    DistributedLockModule,
    PrismaModule,
    UserModule,
    CheckinModule,
    TaskModule,
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
