import mongoose from 'mongoose';
import { config } from './config';
import Logger from 'bunyan';

const logger: Logger = config.createLogger('server');

export default () => {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL!)
      .then(() => {
        logger.info('Successfully connected to database');
      })
      .catch((err) => {
        logger.error('Failed to connect DB with error' + err);
        return process.exit();
      });
  };
  connect();

  mongoose.connection.on('disconnected', connect);
};
