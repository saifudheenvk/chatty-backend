import { blockUserWorker } from '@workers/blocked.worker';
import { BaseQueue } from './base.queue';
import { IBlockedUserJobData } from '@follower/interfaces/follower.interface';



class BlockedQueue extends BaseQueue {
  constructor() {
    super('blocked');
    this.processJob('addBlockedUserToDB', 5, blockUserWorker.updateBlockedUserDataInDB);
  }
  public addBlockedUserJob(name: string, data: IBlockedUserJobData) {
    this.addQueue(name, data);
  }
}

export const blockedQueue = new BlockedQueue();
