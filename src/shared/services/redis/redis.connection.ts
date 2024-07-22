import { BaseCache } from '@services/redis/base.cache';

class RedisConnection extends BaseCache {
  constructor() {
    super('RedisConnection');
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error(err);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
