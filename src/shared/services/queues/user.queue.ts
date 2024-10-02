import { IUserJob } from '@user/interfaces/user.interface';
import { BaseQueue } from './base.queue';
import { userWorker } from '@workers/user.worker';

class UserQueue extends BaseQueue {
  constructor() {
    super('User');
    this.processJob('updateBasicInfoInDB', 5, userWorker.updateBasicInfoInDB);
    this.processJob('addUserToDB', 5, userWorker.addUserToDB);
    this.processJob('updateSocialLinksInDB', 5, userWorker.updateSocialLinks);
    this.processJob('updateNotificationSettings', 5, userWorker.updateNotificationSettings);
  }

  public addUserJob(name: string, data: IUserJob) {
    this.addQueue(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
