import { notificationWorker } from '@workers/notification';
import { BaseQueue } from './base.queue';
import { INotificationJobData } from '@notification/interfaces/notifications.interface';



class NotificationQueue extends BaseQueue {

  constructor() {
    super('notification');
    this.processJob('deleteNotification', 5, notificationWorker.deleteNotification);
    this.processJob('updateNotification', 5, notificationWorker.updateNotification);
  }

  public addNotificationJob(name: string, data: INotificationJobData): void {
    this.addQueue(name, data);
  }
}

export const notificationQueue: NotificationQueue = new NotificationQueue();
