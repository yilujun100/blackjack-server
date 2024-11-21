import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  HttpException,
} from '@nestjs/common';
import { DistributedLockService } from './distributed-lock.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class DistributedLockInterceptor implements NestInterceptor {
  constructor(
    @Inject(DistributedLockService)
    private readonly lockService: DistributedLockService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const handler = context.getHandler();
    const resources = this.reflector.get('lock_resources', handler) || [];
    const ttl = Reflect.getMetadata('lock_ttl', handler) || 1000; // Default TTL is 1s
    try {
      await this.lockService.acquireLock(resources, ttl);
      return next.handle();
    } catch {
      throw new HttpException('Too Many Requests', 429);
    }
  }
}
