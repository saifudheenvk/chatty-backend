import { IFollowerData, IFollowerDocument, IFollowerJobData } from '@follower/interfaces/follower.interface';
import { FollowerModel } from '@follower/models/follower.schema';
import { UserModel } from '@user/models/user.schema';
import mongoose, { Query } from 'mongoose';
import { BulkWriteResult } from 'mongodb';
import { IQueryComplete, IQueryDeleted } from '@post/interfaces/post.interface';
import { IUserDocument } from '@user/interfaces/user.interface';
import { NotificationModel } from '@notification/models/notification.schema';
import { INotificationDocument, INotificationTemplate } from '@notification/interfaces/notifications.interface';
import { socketIONotificationObject } from '@sockets/notification';
import { emailQueue } from '@services/queues/email.queue';
import { notificationTemplate } from '@services/emails/templates/notifications/notification-template';
import { UserCache } from '@services/redis/user.cache';
import { map } from 'lodash';


const userCache: UserCache = new UserCache();

class FollowerService {
  public async addFollowerToDB(data: IFollowerJobData): Promise<void> {
    const follower: IFollowerDocument = await FollowerModel.create({
      _id: data.followerDocumentId,
      followeeId: new mongoose.Types.ObjectId(data.keyOne),
      followerId: new mongoose.Types.ObjectId(data.keyTwo),
    });

    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: data.keyOne },
          update: { $inc: { followingCount: 1 } },
        }
      },
      {
        updateOne: {
          filter: { _id: data.keyTwo },
          update: { $inc: { followersCount: 1 } },
        }
      }
    ]);

    const response: [BulkWriteResult, IUserDocument | null] = await Promise.all([users, userCache.getUserFromCache(data.keyOne!)]);

    if(response[1]?.notifications.follows) {
      const notificationModel: INotificationDocument = new NotificationModel();
      const notifications: INotificationDocument[] = await notificationModel.insertNotification({
        userTo: data.keyOne!,
        userFrom: data.keyTwo!,
        message: `${data.username} started following you`,
        notificationType: 'follow',
        entityId: new mongoose.Types.ObjectId(data.followerDocumentId),
        createdItemId: new mongoose.Types.ObjectId(follower._id),
        reaction: '',
        comment: '',
        post: '',
        imgId: '',
        imgVersion: '',
        gifUrl: '',
        createdAt: new Date()
      });
      socketIONotificationObject.emit('insert notification', notifications, { userTo: data.keyOne });
      const templateParams: INotificationTemplate = {
        message: `${data.username} started following you`,
        header: 'Follow Notification',
        username: data.username!
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.addEmailJob('followerEmail', { receiverEmail: response[1].email!, template, subject: 'Follow Notification' });
    }
  }

  public async removeFollowerFromDB(followeeId: string, followerId: string): Promise<void> {
    const unfollow: Query<IQueryComplete & IQueryDeleted, IFollowerDocument> =  FollowerModel.deleteOne({
      followeeId: followeeId,
      followerId: followerId
    });
    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followingCount: -1 } },
        }
      },
      {
        updateOne: {
          filter: { _id: followerId },
          update: { $inc: { followersCount: -1 } },
        }
      }
    ]);
    await Promise.all([users, unfollow]);
  }

  public async getFolloyeesFromDB(userId: string): Promise<IFollowerData[]> {
    const folloyees: IFollowerData[] = await FollowerModel.aggregate([
      { $match: {followeeId: new mongoose.Types.ObjectId(userId)} },
      { $lookup: { from: 'User', localField: 'followeeId', foreignField: '_id', as: 'followeeId'} },
      { $unwind: '$followeeId' },
      { $lookup: { from: 'Auth', localField: '$followeeId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followeeId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          profilePicture: '$authId.profilePicture',
          followersCount: '$followeeId.followersCount',
          followingCount: '$followeeId.followingCount',
          userProfile: '$followeeId'
        }
      },
      { $project: {
        _v: 0,
        authId: 0,
        followeeId: 0,
        followerId: 0
      }}
    ]) as IFollowerData[];
    return folloyees;
  }

  public async getFollowersFromDB(userId: string): Promise<IFollowerData[]> {
    const followers: IFollowerData[] = await FollowerModel.aggregate([
      { $match: { followeeId: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'User', localField: 'followerId', foreignField: '_id', as: 'followerId' } },
      { $unwind: '$followerId' },
      { $lookup: { from: 'Auth', localField: 'followerId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followerId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          postCount: '$followerId.postsCount',
          followersCount: '$followerId.followersCount',
          followingCount: '$followerId.followingCount',
          profilePicture: '$followerId.profilePicture',
          userProfile: '$followerId'
        }
      },
      { $project: {
          followerId: 0,
          authId: 0,
          followeeId: 0,
          _v: 0
        } 
      }
    ]);

    return followers as IFollowerData[];
  }
  public async getFolloweesIds(userId: string): Promise<string[]> {
    const followee = await FollowerModel.aggregate([
      { $match: { followerId: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          followeeId: 1,
          _id: 0
        }
      }
    ]);
    return map(followee, (result) => result.followeeId.toString());
  }
}

export const followerService = new FollowerService();
