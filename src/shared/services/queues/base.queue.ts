import Queue, { Job } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ExpressAdapter } from '@bull-board/express';
import { IAuthJob } from '@auth/interfaces/auth.interface';
import { IEmailJob, IUserJob } from '@user/interfaces/user.interface';
import { IPostJobData } from '@post/interfaces/post.interface';
import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ICommentJob } from '@comments/interfaces/comments.interface';
import { IBlockedUserJobData, IFollowerJobData } from '@follower/interfaces/follower.interface';
import { INotificationJobData } from '@notification/interfaces/notifications.interface';
import { IFileImageJobData } from '@image/interfaces/image.interface';
import { IChatJobData, IMessageData } from '@chat/interfaces/chat.interface';

let bullAdapters: BullAdapter[] = [];

export let serverAdapter: ExpressAdapter;

type IBaseJobData = IAuthJob |
  IUserJob |
  IEmailJob | 
  IPostJobData | 
  IReactionJob | 
  ICommentJob | 
  IFollowerJobData | 
  IBlockedUserJobData | 
  INotificationJobData | 
  IFileImageJobData |
  IChatJobData |
  IMessageData;

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
    bullAdapters.push(new BullAdapter(this.queue));
    bullAdapters = [...new Set(bullAdapters)]; //remove duplicate queues
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: bullAdapters,
      serverAdapter
    });

    this.log = config.createLogger(`${queueName}Queue`);

    this.queue.on('completed', (job: Job) => {
      job.remove();
    });

    this.queue.on('global:completed', (jobId: string) => {
      this.log.info(`Job ${jobId} completed`);
    });

    this.queue.on('global:stalled', (jobId: string) => {
      this.log.info(`Job ${jobId} is stalled`);
    });
  }

  protected addQueue(name: string, data: IBaseJobData): void {
    this.queue.add(name, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } });
  }

  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>): void {
    this.queue.process(name, concurrency, callback);
  }
}
