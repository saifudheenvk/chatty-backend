import mongoose from 'mongoose';
import { config } from '@root/config';
import Logger from 'bunyan';
import { redisConnection } from '@services/redis/redis.connection';

const logger: Logger = config.createLogger('server');

export default () => {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL!)
      .then(() => {
        logger.info('Successfully connected to database');
        redisConnection.connect();
      })
      .catch((err) => {
        logger.error('Failed to connect DB with error' + err);
        return process.exit();
      });
  };
  connect();

  mongoose.connection.on('disconnected', connect);
};
