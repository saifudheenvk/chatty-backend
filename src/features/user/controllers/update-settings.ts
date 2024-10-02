import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { notificationSettingsSchema } from '@user/schemes/info';
import { UserCache } from '@services/redis/user.cache';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { userQueue } from '@services/queues/user.queue';

const userCache: UserCache = new UserCache();

export class UpdateSettings {
  @JoiValidation(notificationSettingsSchema)
  public async notification(req: Request, res: Response): Promise<void> {
    await userCache.updateSingleUserFromcache(`${req.currentUser!.userId}`, 'notifications', req.body);
    userQueue.addUserJob('updateNotificationSettings', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification settings updated successfully', settings: req.body });
  }
}
