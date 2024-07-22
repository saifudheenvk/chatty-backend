import { config } from '@root/config';
import Logger from 'bunyan';
import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

export abstract class BaseCache {
  client: RedisClient;
  logger: Logger;

  constructor(cachedName: string) {
    this.client = createClient({ url: config.REDIS_HOST });
    this.logger = config.createLogger(cachedName);
    this.cacheError();
  }

  public cacheError(): void {
    this.client.on('error', (err: unknown) => {
      this.logger.error(err);
    });
  }
}
