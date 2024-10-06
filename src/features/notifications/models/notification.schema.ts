import { INotification, INotificationDocument } from '@notification/interfaces/notifications.interface';
import { notificationService } from '@services/db/notification.service';
import { model, Model, Schema } from 'mongoose';




const notificationSchema: Schema = new Schema({
  userTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  userFrom: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  read: { type: Boolean, default: false },
  notificationType: { type: String, default: '' },
  entityId: Schema.Types.ObjectId ,
  comment: { type: String, default: '' },
  post: { type: String, default: '' },
  createdItemId: Schema.Types.ObjectId,
  reaction: { type: String, default: '' },
  imgId: { type: String, default: '' },
  imgVersion: { type: String, default: '' },
  gifUrl: { type: String, default: '' },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.methods.insertNotification = async function (body: INotification) {
  const { userTo, userFrom, notificationType, entityId, comment, post, createdItemId, reaction, imgId, imgVersion, gifUrl, message } = body;
  await this.model('Notification').create({
    userTo,
    userFrom,
    notificationType,
    entityId,
    comment,
    post,
    createdItemId,
    reaction,
    imgId,
    imgVersion,
    gifUrl,
    message
  });
  try {
    const notifications: INotificationDocument[] = await notificationService.getNotifications(userTo);
    return notifications;
  } catch (error) {
    return error;
  }
};

export const NotificationModel: Model<INotificationDocument> = model<INotificationDocument>('Notification', notificationSchema, 'Notification');
