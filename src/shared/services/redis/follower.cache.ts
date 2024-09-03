import { IFollowerData } from '@follower/interfaces/follower.interface';
import { ServerError } from '@global/helpers/error-handler';
import { BaseCache } from '@services/redis/base.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserCache } from '@services/redis/user.cache';
import mongoose from 'mongoose';
import { Helper } from '@global/helpers/helper';
import { remove } from 'lodash';



const userCache: UserCache = new UserCache();

export class FollowerCache extends BaseCache {
  constructor() {
    super('followersCache');
  }

  public async saveFollowersToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.LPUSH(key, value);
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removeFromFollowersCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.LREM(key, 1, value);
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getFollowersFromCache(key: string): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(key, 0, -1);
      const folloewers: IFollowerData[] = [];
      for (const item of response) {
        const userData: IUserDocument = await userCache.getUserFromCache(item) as IUserDocument;
        const folloerData: IFollowerData = {
          username: userData.username!,
          avatarColor: userData.avatarColor!,
          profilePicture: userData.profilePicture,
          uId: userData.uId!,
          followersCount: userData.followersCount,
          followingCount: userData.followingCount,
          _id: new mongoose.Types.ObjectId(userData._id),
        };
        folloewers.push(folloerData);
      }
      return folloewers;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateFolloersCountInCache(key: string, property: string, value: number): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.HINCRBY(`user:${key}`, property, value);
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateBlockedUserPropInCache(key: string, prop: string, value: string, type: 'block' | 'unblock'): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string = (await this.client.HGET(`user:${key}`, prop)) as string;
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      let blocked: string[] = Helper.parseJson(response) as string[];
      if (type === 'block') {
        blocked = [...blocked, value];
      } else {
        remove(blocked, (id: string) => id === value);
        blocked = [...blocked];
      }
      multi.HSET(`users:${key}`, `${prop}`, JSON.stringify(blocked));
      await multi.exec();
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

}
