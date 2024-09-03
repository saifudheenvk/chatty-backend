import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@services/redis/follower.cache';
import { IFollowerData } from '@follower/interfaces/follower.interface';
import { Request, Response } from 'express';
import { followerService } from '@services/db/follower.service';


const followerCache: FollowerCache = new FollowerCache();

export class GetFollower {
  public async followers(req: Request, res: Response): Promise<void> {
    const userId: string = req.params.userId;
    const cachedFollowers: IFollowerData[] = await followerCache.getFollowersFromCache(`follower:${userId}`);
    const followers: IFollowerData[] = cachedFollowers.length ? cachedFollowers : await followerService.getFollowersFromDB(userId);
    res.status(HTTP_STATUS.OK).json({ message: 'All user followers', followers });
  }

  public async followings(req: Request, res: Response): Promise<void> {
    const userId: string = req.currentUser!.userId;
    const cachedFollowings: IFollowerData[] = await followerCache.getFollowersFromCache(`following:${userId}`);
    const followings: IFollowerData[] = cachedFollowings.length ? cachedFollowings : await followerService.getFolloyeesFromDB(userId);
    res.status(HTTP_STATUS.OK).json({ message: 'All user followings', followings });
  }
}
