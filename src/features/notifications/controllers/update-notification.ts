import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { socketIONotificationObject } from '@sockets/notification';
import { notificationQueue } from '@services/queues/notification.queue';





export class Update {

  public async update(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    socketIONotificationObject.emit('update notification', notificationId);
    notificationQueue.addNotificationJob('updateNotification', { key: notificationId });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification marked as read' });
  }
}
