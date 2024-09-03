import { config } from '@root/config';
import { followerService } from '@services/db/follower.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';



const logger: Logger = config.createLogger('followWorker');

class FollowerWorker {
  async addFollowerToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data = job.data;
      await followerService.addFollowerToDB(data);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  } 

  async removeFollowerFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyOne, keyTwo } = job.data;
      await followerService.removeFollowerFromDB(keyOne, keyTwo);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  } 
}

export const followerWorker: FollowerWorker = new FollowerWorker();
