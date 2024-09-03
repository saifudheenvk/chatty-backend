import { followerWorker } from '@workers/follower.worker';
import { BaseQueue } from './base.queue';
import { IFollowerJobData } from '@follower/interfaces/follower.interface';




class FollowerQueue extends BaseQueue {
  constructor() {
    super('Follow');
    this.processJob('addFollowerToDB', 5, followerWorker.addFollowerToDB);
    this.processJob('removeFollowerFromDB', 5, followerWorker.removeFollowerFromDB);
  }

  public addFollowerJob(name: string, data: IFollowerJobData) {
    this.addQueue(name, data);
  }
}

export const followerQueue = new FollowerQueue();
