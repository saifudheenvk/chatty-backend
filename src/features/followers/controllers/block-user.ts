import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@services/redis/follower.cache';
import { IBlockedUserJobData } from '@follower/interfaces/follower.interface';
import { blockedQueue } from '@services/queues/blocked.queue';


const followerCache: FollowerCache = new FollowerCache();

export class Block {

  public async blockUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const currentUserId: string = `${req.currentUser!.userId}`;
    Block.prototype.updateBlockedUserDataInCache(userId, currentUserId, 'block');
    const blockedUserJobData: IBlockedUserJobData = {
      keyOne: currentUserId,
      keyTwo: userId,
      type: 'block'
    };
    blockedQueue.addBlockedUserJob('addBlockedUserToDB', blockedUserJobData);
    res.status(HTTP_STATUS.OK).json({ message: 'User blocked' });
  }

  public async unblockUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const currentUserId: string = `${req.currentUser!.userId}`;
    Block.prototype.updateBlockedUserDataInCache(userId, currentUserId, 'unblock');
    const blockedUserJobData: IBlockedUserJobData = {
      keyOne: currentUserId,
      keyTwo: userId,
      type: 'unblock'
    };
    blockedQueue.addBlockedUserJob('addBlockedUserToDB', blockedUserJobData);
    res.status(HTTP_STATUS.OK).json({ message: 'User unblocked' });
  }

  private updateBlockedUserDataInCache(userId: string, currentUserId: string, type: 'block' | 'unblock'): void {
    const blocked: Promise<void> = followerCache.updateBlockedUserPropInCache(`${currentUserId}`, 'blocked', userId, type);
    const blockedBy: Promise<void> = followerCache.updateBlockedUserPropInCache(`${userId}`, 'blockedBy', currentUserId, type);
    Promise.all([blockedBy, blocked]);
  }
}
