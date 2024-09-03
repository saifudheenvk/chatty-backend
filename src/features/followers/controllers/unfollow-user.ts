import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@services/redis/follower.cache';
import { Request, Response } from 'express';
import { followerQueue } from '@services/queues/follow.queue';


const followerCache: FollowerCache = new FollowerCache();

export class Unfollow {

  async unfollowUser(req: Request, res: Response): Promise<void> {
    const { followerId } = req.params;
    const userId = req.currentUser!.userId;

    const removeFollowerFromCache: Promise<void> = followerCache.removeFromFollowersCache(`following:${userId}`, `${followerId}`);
    const removeFolloweeFromCache: Promise<void> = followerCache.removeFromFollowersCache(`follower:${followerId}`, `${userId}`);
    
    const followersCount: Promise<void> = followerCache.updateFolloersCountInCache(`${followerId}`, 'followersCount', -1);
    const followingCount: Promise<void> = followerCache.updateFolloersCountInCache(`${userId}`, 'followingCount', -1);

    await Promise.all([removeFollowerFromCache, removeFolloweeFromCache, followersCount, followingCount]);

    followerQueue.addFollowerJob('removeFollowerFromDB', { keyOne: userId, keyTwo: followerId });

    res.status(HTTP_STATUS.OK).json({ message: 'Unfollowed successfully' });

  }
}
