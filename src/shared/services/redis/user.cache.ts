import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { IUserDocument } from '@user/interfaces/user.interface';
import { BaseCache } from '@services/redis/base.cache';
import { Helper } from '@global/helpers/helper';
import { ServerError } from '@global/helpers/error-handler';
import { findIndex } from 'lodash';


type UserCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IUserDocument | IUserDocument[];

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }

  public async saveToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;

    const dataToSave = {
      _id: `${_id}`,
      uId: `${uId}`,
      username: `${username}`,
      email: `${email}`,
      avatarColor: `${avatarColor}`,
      createdAt: `${createdAt}`,
      postsCount: `${postsCount}`,
      blocked: JSON.stringify(blocked),
      blockedBy: JSON.stringify(blockedBy),
      profilePicture: `${profilePicture}`,
      followersCount: `${followersCount}`,
      followingCount: `${followingCount}`,
      notifications: JSON.stringify(notifications),
      social: JSON.stringify(social),
      work: `${work}`,
      location: `${location}`,
      school: `${school}`,
      quote: `${quote}`,
      bgImageVersion: `${bgImageVersion}`,
      bgImageId: `${bgImageId}`
    };

    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`user:${key}`, itemKey, itemValue);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const response: IUserDocument = (await this.client.HGETALL(`user:${userId}`)) as unknown as IUserDocument;
      if (response._id) {
        response.createdAt = new Date(Helper.parseJson(`${response.createdAt}`));
        response.postsCount = Helper.parseJson(`${response.postsCount}`);
        response.blocked = Helper.parseJson(`${response.blocked}`);
        response.blockedBy = Helper.parseJson(`${response.blockedBy}`);
        response.notifications = Helper.parseJson(`${response.notifications}`);
        response.social = Helper.parseJson(`${response.social}`);
        response.followersCount = Helper.parseJson(`${response.followersCount}`);
        response.followingCount = Helper.parseJson(`${response.followingCount}`);
        response.bgImageId = Helper.parseJson(`${response.bgImageId}`);
        response.bgImageVersion = Helper.parseJson(`${response.bgImageVersion}`);
        response.profilePicture = Helper.parseJson(`${response.profilePicture}`);
        response.work = Helper.parseJson(`${response.work}`);
        response.school = Helper.parseJson(`${response.school}`);
        response.location = Helper.parseJson(`${response.location}`);
        response.quote = Helper.parseJson(`${response.quote}`);
      }
      return response;
    } catch (e) {
      this.logger.error(e);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUsersFromCache(start: number, end: number, excludedUserKey: string): Promise<IUserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.ZRANGE('user', start, end, { REV: true }) as string[];
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const key of response) {
       if(key !== excludedUserKey) {
        multi.HGETALL(`user:${key}`);
       }
      }
      const users: UserCacheMultiType = (await multi.exec()) as UserCacheMultiType;
      const usersResult: IUserDocument[] = [];
      for (const user of users as IUserDocument[]) {
        usersResult.push(user as unknown as IUserDocument);
      }
      usersResult.map((user) => {
        user.createdAt = new Date(Helper.parseJson(`${user.createdAt}`));
        user.postsCount = Helper.parseJson(`${user.postsCount}`);
        user.blocked = Helper.parseJson(`${user.blocked}`);
        user.blockedBy = Helper.parseJson(`${user.blockedBy}`);
        user.notifications = Helper.parseJson(`${user.notifications}`);
        user.social = Helper.parseJson(`${user.social}`);
        user.followersCount = Helper.parseJson(`${user.followersCount}`);
        user.followingCount = Helper.parseJson(`${user.followingCount}`);
        user.bgImageId = Helper.parseJson(`${user.bgImageId}`);
        user.bgImageVersion = Helper.parseJson(`${user.bgImageVersion}`);
        user.profilePicture = Helper.parseJson(`${user.profilePicture}`);
        user.work = Helper.parseJson(`${user.work}`);
        user.school = Helper.parseJson(`${user.school}`);
        user.location = Helper.parseJson(`${user.location}`);
        user.quote = Helper.parseJson(`${user.quote}`);
      });
      return usersResult;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalUsersInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCARD('user'); // returns the number of elements in the sorted set
      return count;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getRandomUsersFromCache(userId: string, username: string): Promise<IUserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const usersResult: IUserDocument[] = [];
      const followers: string[] = await this.client.LRANGE(`follower:${userId}`, 0, -1);
      const users: string[] = await this.client.ZRANGE('user', 0, -1, { REV: true }) as string[];
      const randomUsers: string[] = Helper.shuffle(users).slice(0, 10);
      for (const user of randomUsers) {
        if (!followers.includes(user)) {
          const userFromCache: IUserDocument = (await this.client.HGETALL(`user:${user}`)) as unknown as IUserDocument;
          usersResult.push(userFromCache);
        }
      }
      const excludedUsernameIndex: number = findIndex(usersResult, ['username', username]);
      usersResult.splice(excludedUsernameIndex, 1);
      usersResult.map((user) => {
        user.createdAt = new Date(Helper.parseJson(`${user.createdAt}`));
        user.postsCount = Helper.parseJson(`${user.postsCount}`);
        user.blocked = Helper.parseJson(`${user.blocked}`);
        user.blockedBy = Helper.parseJson(`${user.blockedBy}`);
        user.notifications = Helper.parseJson(`${user.notifications}`);
        user.social = Helper.parseJson(`${user.social}`);
        user.followersCount = Helper.parseJson(`${user.followersCount}`);
        user.followingCount = Helper.parseJson(`${user.followingCount}`);
        user.bgImageId = Helper.parseJson(`${user.bgImageId}`);
        user.bgImageVersion = Helper.parseJson(`${user.bgImageVersion}`);
        user.profilePicture = Helper.parseJson(`${user.profilePicture}`);
        user.work = Helper.parseJson(`${user.work}`);
        user.school = Helper.parseJson(`${user.school}`);
        user.location = Helper.parseJson(`${user.location}`);
        user.quote = Helper.parseJson(`${user.quote}`);
      });
      return usersResult;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateSingleUserFromcache(key: string, prop: string, value: string): Promise<IUserDocument> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.HSET(`user:${key}`, `${prop}`, JSON.stringify(value));
      const response: IUserDocument = await this.getUserFromCache(key) as IUserDocument;
      return response;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
