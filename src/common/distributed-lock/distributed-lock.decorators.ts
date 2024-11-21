import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { DistributedLockInterceptor } from './distributed-lock.interceptor';

export function DistributedLock(resourcesProvider: string[], ttl: number) {
  return applyDecorators(
    SetMetadata('lock_resources', resourcesProvider),
    SetMetadata('lock_ttl', ttl),
    UseInterceptors(DistributedLockInterceptor),
  );
}
