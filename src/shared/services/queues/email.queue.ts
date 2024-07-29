import { IEmailJob } from '@user/interfaces/user.interface';
import { BaseQueue } from './base.queue';
import { emailWorker } from '@workers/email.worker';



class EmailQueue extends BaseQueue {
  constructor() {
    super('Email');
    this.processJob('forgotPasswordEmail', 5, emailWorker.addNotificationEmail);
  }

  public addEmailJob(name: string, data: IEmailJob): void {
    this.addQueue(name, data);
  }
}

export const emailQueue = new EmailQueue();
