import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { userService } from '@services/db/user.service';

const log: Logger = config.createLogger('userWorker');

class UserWorker {
  async addUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { value } = job.data;
      //add method to send data to databse
      await userService.createUser(value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async updateBasicInfoInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await userService.updateBasicInfoInDB(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async updateSocialLinks(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await userService.updateSocialLinks(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async updateNotificationSettings(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await userService.updateNotificationSettings(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

}

export const userWorker: UserWorker = new UserWorker();
