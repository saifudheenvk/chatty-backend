import { IPostDocument, ISavePostToCache } from '@post/interfaces/post.interface';
import { BaseCache } from '@services/redis/base.cache';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import { Helper } from '@global/helpers/helper';
import { IReactions } from '@reaction/interfaces/reaction.interface';
import { ServerError } from '@global/helpers/error-handler';

export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super('postCache');
  }

  public async saveToCache(data: ISavePostToCache) {
    const { key, currentUserId, uId, createdPost } = data;
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      reactions,
      createdAt
    } = createdPost;

    const dataToSave = {
      '_id': `${_id}`,
      'userId': `${userId}`,
      'username': `${username}`,
      'email': `${email}`,
      'avatarColor': `${avatarColor}`,
      'profilePicture': `${profilePicture}`,
      'post': `${post}`,
      'bgColor': `${bgColor}`,
      'feelings': `${feelings}`,
      'privacy': `${privacy}`,
      'gifUrl': `${gifUrl}`,
      'commentsCount': `${commentsCount}`,
      'reactions': JSON.stringify(reactions),
      'imgVersion': `${imgVersion}`,
      'imgId': `${imgId}`,
      'createdAt': `${createdAt}`
    };

    try {
      if(!this.client.isOpen) {
        this.client.connect();
      }
      const postCount: string[] = await this.client.HMGET(`user:${currentUserId}`, 'postsCount');
      this.logger.info('postCount', postCount);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      await this.client.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        multi.HSET(`post:${key}`, itemKey, itemValue);
      }
      const count: number = parseInt(postCount[0], 10) + 1;
      multi.HSET(`user:${currentUserId}`, 'postsCount', count);
      await multi.exec();
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async getPostsFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if(!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`post:${value}`);
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReplies: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helper.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helper.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helper.parseJson(`${post.createdAt}`)) as Date;
        postReplies.push(post);
      }
      return postReplies;
    } catch(e) {
      this.logger.error(e);
      throw new ServerError('Server error. Try again.');
    }

  }

  public async getTotalPostsInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCARD('post');
      return count;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostsWithImagesFromCache(key: string, start: number, end: number) : Promise<IPostDocument[]> {
    try {
      if(!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`post:${value}`);
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReplies: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        if((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helper.parseJson(`${post.commentsCount}`) as number;
          post.reactions = Helper.parseJson(`${post.reactions}`) as IReactions;
          post.createdAt = new Date(Helper.parseJson(`${post.createdAt}`)) as Date;
          postReplies.push(post);
        }
      }
      return postReplies;
    } catch(e) {
      this.logger.error(e);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUserPostsFromCache(key: string, uId: number) : Promise<IPostDocument[]> {
    try {
      if(!this.client.isOpen) {
        this.client.connect();
      }
      const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`post:${value}`);
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReplies: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helper.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helper.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helper.parseJson(`${post.createdAt}`)) as Date;
        postReplies.push(post);
      }
      return postReplies;
    } catch(e) {
      this.logger.error(e);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalUserPostsInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async deletePost(key: string, userId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const postCount: string[] = await this.client.HMGET(`user:${userId}`, 'postsCount');
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZREM('post', key);
      multi.DEL(`post:${key}`);
      multi.DEL(`comments:${key}`);
      multi.DEL(`reactions:${key}`);
      const count: number = parseInt(postCount[0], 10) - 1;
      multi.HSET(`user:${userId}`, 'postsCount', count);
      await multi.exec();
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updatePost(key: string, data: IPostDocument): Promise<IPostDocument> {
    try {
      const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = data;
      const dataToSave = {
        'post': `${post}`,
        'bgColor': `${bgColor}`,
        'feelings': `${feelings}`,
        'privacy': `${privacy}`,
        'gifUrl': `${gifUrl}`,
        'profilePicture': `${profilePicture}`,
        'imgVersion': `${imgVersion}`,
        'imgId': `${imgId}`
      };
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`post:${key}`,`${itemKey}`, `${itemValue}`);
      }
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.HGETALL(`post:${key}`);
      const reply: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReply = reply as IPostDocument[];
      postReply[0].commentsCount = Helper.parseJson(`${postReply[0].commentsCount}`) as number;
      postReply[0].reactions = Helper.parseJson(`${postReply[0].reactions}`) as IReactions;
      postReply[0].createdAt = new Date(Helper.parseJson(`${postReply[0].createdAt}`)) as Date;
      return postReply[0];
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again later');
    }
  }
}
