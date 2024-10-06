import { config } from '@root/config';
import { reactionService } from '@services/db/reactions.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';


const logger: Logger = config.createLogger('reactionWorker');

class ReactionWorker {
  async addReactionToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data = job.data;
      await reactionService.addReactionDataToDB(data);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }

  async removeReactionFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data = job.data;
      await reactionService.removeReactionDataFromDB(data);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }
}

export const reactionWorker: ReactionWorker = new ReactionWorker();
