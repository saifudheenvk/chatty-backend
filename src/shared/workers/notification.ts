import { config } from '@root/config';
import { notificationService } from '@services/db/notification.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';


const log: Logger = config.createLogger('notificationWorker');

class NotificationWorker {

  public async deleteNotification(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key } = job.data;
      await notificationService.deleteNotification(key);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  public async updateNotification(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key } = job.data;
      await notificationService.updateNotification(key);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const notificationWorker = new NotificationWorker();
