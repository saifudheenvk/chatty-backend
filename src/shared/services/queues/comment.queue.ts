import { commentWorker } from '@workers/comment.worker';
import { BaseQueue } from './base.queue';
import { ICommentJob } from '@comments/interfaces/comments.interface';



class CommentQueue extends BaseQueue {
  constructor() {
    super('comment');
    this.processJob('addCommentToDB', 5, commentWorker.addCommentToDB);
  }

  public addCommentJob(name: string, data: ICommentJob): void {
    this.addQueue(name, data);
  }
}

export const commentQueue: CommentQueue = new CommentQueue();
