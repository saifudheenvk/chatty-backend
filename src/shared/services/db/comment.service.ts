import { NotificationModel } from '@notification/models/notification.schema';
import { ICommentDocument, ICommentJob, ICommentNameList, IQueryComment } from '@comments/interfaces/comments.interface';
import { CommentModel } from '@comments/models/comments.schema';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import mongoose, { Query } from 'mongoose';
import { INotificationDocument, INotificationTemplate } from '@notification/interfaces/notifications.interface';
import { notificationTemplate } from '@services/emails/templates/notifications/notification-template';
import { emailQueue } from '@services/queues/email.queue';
import { socketIONotificationObject } from '@sockets/notification';
import Logger from 'bunyan';
import { config } from '@root/config';



const userCache: UserCache = new UserCache();
const logger: Logger = config.createLogger('commentService');
class CommentService {
  public async saveCommentToDB(data: ICommentJob): Promise<void> {
    const { postId, userTo, userFrom, username, comment } = data;
    const newComment: Promise<ICommentDocument> =  CommentModel.create(comment);
    const post: Query<IPostDocument, IPostDocument> = PostModel.findOneAndUpdate({_id: postId}, {
      $inc: {
        commentsCount: 1
      }
    }, {
      new: true
    }) as Query<IPostDocument, IPostDocument>;
    const user: Promise<IUserDocument> = userCache.getUserFromCache(`${userTo}`) as Promise<IUserDocument>;
    const response: [ICommentDocument, IPostDocument, IUserDocument] = await Promise.all([newComment, post, user]);


    if(response[2] && response[2].notifications.comments && userFrom !== userTo) { 
     const notificationModel: INotificationDocument = new NotificationModel();
     const notifications: INotificationDocument[] = await notificationModel.insertNotification({
       userTo,
       userFrom,
       message: `${username} commented on your post`,
       notificationType: 'comment',
       entityId: new mongoose.Types.ObjectId(postId),
       createdItemId: new mongoose.Types.ObjectId(response[0]._id),
       comment: comment.comment,
       post: response[1].post,
       createdAt: new Date(),
       reaction: '',
       imgId: response[1].imgId!,
       imgVersion: response[1].imgVersion!,
       gifUrl: response[1].gifUrl!
     });
     socketIONotificationObject.emit('insert notification', notifications, { userTo });
     const templateParams: INotificationTemplate = {
      username: response[2].username!,
      message: `${username} commented on your post.`,
      header: 'Comment Notification'
      };
      const template = notificationTemplate.notificationMessageTemplate(templateParams);
      logger.info(userTo);
      emailQueue.addEmailJob('commentsEmail', { receiverEmail: response[2].email!, template, subject: 'Post notification' });
    }
  }

  public async getCommentsFromDB(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]> {
    const comments: ICommentDocument[] = await CommentModel.aggregate([{$match: query}, {$sort: sort}]);
    return comments;
  }

  public async getPostCommentNamesFromDB(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentNameList[]> {
    const commentsNamesList: ICommentNameList[] = await CommentModel.aggregate([{ $match: query }, { $sort: sort }, { $group: {_id: null, names: { $addToSet: '$username' }, count: { $sum: 1 }} }, { $project: { _id: 0 }}]);
    return commentsNamesList;
  }
}

export const commentService: CommentService = new CommentService();
