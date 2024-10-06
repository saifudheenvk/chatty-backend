import { INotificationDocument } from '@notification/interfaces/notifications.interface';
import { NotificationModel } from '@notification/models/notification.schema';
import mongoose from 'mongoose';




class NotificationService {
  public async getNotifications(userId: string): Promise<INotificationDocument[]> {
    // Ineed user from details, it's auth details
    const notifications: INotificationDocument[] = await NotificationModel.aggregate([{$match: { userTo: new mongoose.Types.ObjectId(userId) }}, 
      { $lookup: { from: 'User', localField: 'userFrom', foreignField: '_id', as: 'userFrom' } },
      { $unwind: '$userFrom' },
      { $lookup: { from: 'AuthId', localField: 'userFrom.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: {
        _id: 1,
        userTo: 1,
        message: 1,
        notificationType: 1,
        entityId: 1,
        createdItemId: 1,
        comment: 1,
        reaction: 1,
        post: 1,
        imgId: 1,
        imgVersion: 1,
        gifUrl: 1,
        read: 1,
        createdAt: 1,
        userFrom: {
          profilePicture: '$userFrom.profilePicture',
          username: '$authId.username',
          uId: '$authId.uId',
          avatarColor: '$authId.avatarColor'
        }
      } }]);

    return notifications;
  }

  public async deleteNotification(notificationId: string): Promise<void> {
    await NotificationModel.deleteOne({ _id: new mongoose.Types.ObjectId(notificationId) }).exec();
  }

  public async updateNotification(notificationId: string): Promise<void> {
    await NotificationModel.updateOne({ _id: new mongoose.Types.ObjectId(notificationId) }, { read: { $set: true } }).exec();
  }
}

export const notificationService: NotificationService = new NotificationService();
