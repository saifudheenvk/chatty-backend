import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@services/redis/follower.cache';
import { Request, Response } from 'express';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserCache } from '@services/redis/user.cache';
import { socketIOFollowerObject } from '@sockets/follower';
import { IFollowerData, IFollowerJobData } from '@follower/interfaces/follower.interface';
import mongoose from 'mongoose';
import { followerQueue } from '@services/queues/follow.queue';



const followerCache: FollowerCache = new FollowerCache();
const userCache: UserCache = new UserCache();

export class Follow {

  async followUser(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;
    const userId: string = req.currentUser!.userId;
    
    //update followers count
    const followingCount: Promise<void> = followerCache.updateFolloersCountInCache(`${userId}`, 'followingCount', 1);
    const followersCount: Promise<void> = followerCache.updateFolloersCountInCache(`${followerId}`, 'followersCount', 1);
    await Promise.all([followingCount, followersCount]);

    //emit socket io event
    const cachedFollower: Promise<IUserDocument> = userCache.getUserFromCache(`${followerId}`) as Promise<IUserDocument>;
    const cachedFollowee: Promise<IUserDocument> = userCache.getUserFromCache(`${userId}`) as Promise<IUserDocument>;
    const response : [IUserDocument, IUserDocument] = await Promise.all([cachedFollower, cachedFollowee]);
    const followerData: IFollowerData = Follow.prototype.userData(response[0]);
    socketIOFollowerObject.emit('add follower', followerData);

    //save to cache
    const followerToCache: Promise<void> = followerCache.saveFollowersToCache(`follower:${followerId}`, `${userId}`);
    const followeeToCache: Promise<void> = followerCache.saveFollowersToCache(`following:${userId}`, `${followerId}`);
    await Promise.all([followerToCache, followeeToCache]);

    //save to db
    const followerObjectId: ObjectId = new ObjectId();

    const followerToDBObject: IFollowerJobData = {
      followerDocumentId: followerObjectId,
      username: response[0].username!,
      keyOne: `${userId}`,
      keyTwo: `${followerId}`
    };
    followerQueue.addFollowerJob('addFollowerToDB', followerToDBObject);
    res.status(HTTP_STATUS.OK).json({ message: 'Following successfully' });
  }

  private userData(user: IUserDocument): IFollowerData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      avatarColor: user.avatarColor!,
      username: user.username!,
      profilePicture: user.profilePicture,
      followersCount: 0,
      followingCount: 0,
      userProfile: user,
      uId: user.uId!
    };
  }
}
