import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    void this.client.connect().catch((err) => {
      this.logger.warn(`Redis cache connect failed: ${String(err)}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Redis cache set failed for ${key}: ${String(err)}`);
    }
  }

  /** Returns true when the key was newly set (first request in window). */
  async setIfAbsent(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch {
      return true;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      /* ignore */
    }
  }
}
