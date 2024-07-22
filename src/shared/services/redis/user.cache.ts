import { IUserDocument } from '@user/interfaces/user.interface';
import { BaseCache } from '@services/redis/base.cache';
import { Helper } from '@global/helpers/helper';
import { ServerError } from '@global/helpers/error-handler';

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
      this.logger.info(response);
      if (response.id) {
        response.createdAt = new Date(Helper.parseJson(`${response.createdAt}`));
        response.postsCount = Helper.parseJson(`${response.postsCount}`);
        response.blocked = Helper.parseJson(`${response.blocked}`);
        response.blockedBy = Helper.parseJson(`${response.blockedBy}`);
        response.notifications = Helper.parseJson(`${response.notifications}`);
        response.social = Helper.parseJson(`${response.social}`);
        response.followersCount = Helper.parseJson(`${response.followersCount}`);
        response.followingCount = Helper.parseJson(`${response.followingCount}`);
      }
      return response;
    } catch (e) {
      this.logger.error(e);
      throw new ServerError('Server error. Try again');
    }
  }
}
