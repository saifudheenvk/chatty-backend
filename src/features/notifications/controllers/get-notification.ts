import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { INotificationDocument } from '@notification/interfaces/notifications.interface';
import { notificationService } from '@services/db/notification.service';



export class Get {
  public async notifications(req: Request, res: Response): Promise<void> {
    const notifications: INotificationDocument[] = await notificationService.getNotifications(req.currentUser!.userId);
    res.status(HTTP_STATUS.OK).json({ message: 'User notifications', notifications });
  }
}
