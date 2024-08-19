import { IPostJobData } from '@post/interfaces/post.interface';
import { BaseQueue } from './base.queue';
import { postWorker } from '@workers/post.worker';




class PostQueue extends BaseQueue {
  constructor() {
    super('Post');
    this.processJob('addPostToDB', 5, postWorker.addPostToDB);
    this.processJob('deletePostFromDB', 5, postWorker.deletePostFromDB);
    this.processJob('updatePostIntoDB', 5, postWorker.updatePostIntoDB);
  }

  public addPostJob(name: string, data: IPostJobData) {
    this.addQueue(name, data);
  }
}

export const postQueue = new PostQueue();
