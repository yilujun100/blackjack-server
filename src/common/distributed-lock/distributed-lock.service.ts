import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly redlock: Redlock;
  constructor(@InjectRedis() private readonly redis: Redis) {
    this.redlock = new Redlock([this.redis], {
      retryCount: 10, // 重试次数
      retryDelay: 200, // 重试延迟，单位毫秒
      retryJitter: 200, // 重试抖动，避免同一时间所有实例都重试
    });
  }

  async executeTask<T>(
    resources: string[],
    ttl: number,
    task: () => Promise<T>,
    lock?: Lock,
  ): Promise<T> {
    try {
      if (!lock) {
        lock = await this.redlock.acquire(resources, ttl);
      }
    } catch (error) {
      const errMsg = `Error executing task: ${error.message}`;
      this.logger.error(errMsg);
      throw new HttpException(errMsg, 429);
    }

    try {
      const result = await task();
      return result;
    } catch (error) {
      this.logger.error(`Internal Server Error: `, error);
      throw new HttpException('Internal Server Error', 500);
    } finally {
      if (lock) {
        try {
          await lock.release();
        } catch (relError) {
          this.logger.error(`Failed to release lock: ${relError.message}`);
          throw new Error('Failed to release lock');
        }
      }
    }
  }

  /**
   * 不断重试获取锁，直到成功
   * @param resources 锁的资源标识符
   * @param ttl 锁的生存时间（毫秒）
   * @param task 要执行的异步任务
   * @param retryDelay 可选的重试延迟，默认为 1 秒
   */
  async executeTaskUntilSuccess<T>(
    resources: string[],
    ttl: number,
    task: () => Promise<T>,
    retryDelay = 1000,
  ): Promise<T> {
    let lock: Lock;
    while (true) {
      try {
        lock = await this.redlock.acquire(resources, ttl);
        break;
      } catch {
        this.logger.error(
          `Failed to acquire lock, retrying in ${retryDelay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
    return this.executeTask(resources, ttl, task, lock);
  }

  /**
   * 获取锁
   * @param resources 锁的资源标识符
   * @param ttl 锁的生存时间（毫秒）
   * @returns 锁对象
   */
  async acquireLock(resources: string[], ttl: number) {
    try {
      const lock = await this.redlock.acquire(resources, ttl);
      return lock;
    } catch {
      throw new Error('Failed to acquire lock');
    }
  }

  async releaseLock(lock: any) {
    try {
      await lock.release();
    } catch {
      throw new Error('Failed to release lock');
    }
  }
}
