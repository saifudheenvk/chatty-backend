import { config } from '@root/config';
import { postService } from '@services/db/post.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';


const logger: Logger = config.createLogger('postWorker');

class PostWorker {
  async addPostToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await postService.createPost(key, value);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }

  async deletePostFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyTow, keyOne } = job.data;
      await postService.deletePost(keyTow, keyOne);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }

  async updatePostIntoDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await postService.updatePost(key, value);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }
}


export const postWorker: PostWorker = new PostWorker();
