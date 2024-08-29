import { config } from '@root/config';
import { commentService } from '@services/db/comment.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';

const logger: Logger = config.createLogger('commentWorker');

class CommentWorker {
  async addCommentToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data = job.data;
      await commentService.saveCommentToDB(data);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      logger.error(error);
      done(error as Error);
    }
  }
    
}

export const commentWorker: CommentWorker = new CommentWorker();
