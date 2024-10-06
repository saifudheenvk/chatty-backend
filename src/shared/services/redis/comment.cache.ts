import { ICommentDocument, ICommentNameList } from '@comments/interfaces/comments.interface';
import { ServerError } from '@global/helpers/error-handler';
import { Helper } from '@global/helpers/helper';
import { config } from '@root/config';
import { BaseCache } from '@services/redis/base.cache';
import Logger from 'bunyan';



const logger: Logger = config.createLogger('commentCache');

export class CommentCache extends BaseCache {
  constructor() {
    super('commentsCache');
  }

  public async savePostCommentToCache(postId: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.LPUSH(`comments:${postId}`, value);
      const commentsCount: string[] = await this.client.HMGET(`post:${postId}`, 'commentsCount');
      let count: number = Helper.parseJson(`${commentsCount[0]}`) as number;
      count += 1;
      await this.client.HSET(`post:${postId}`, 'commentsCount', count);
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];
      for (const item of response) {
        list.push(Helper.parseJson(item));
      }
      return list;
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getSingleCommentFromCache(postId: string, commentId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];
      for (const item of response) {
        list.push(Helper.parseJson(item));
      }
      const comment: ICommentDocument = list.find((comment: ICommentDocument) => {
        return comment._id === commentId;
      }) as ICommentDocument;
      return [comment];
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getCommentNamesAndCountFromCache(postId: string): Promise<ICommentNameList[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const commentsCount: number = await this.client.LLEN(`comments:${postId}`);
      const list: string[] = [];
      for (const item of comments) {
        const comment: ICommentDocument = Helper.parseJson(item) as ICommentDocument;
        list.push(comment.username);
      }
      const response: ICommentNameList = {
        names: list,
        count: commentsCount
      };
      return [response];
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removeCommentFromCache(postId: string, commentId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.LREM(`comments:${postId}`, 0, JSON.stringify({ _id: commentId }));
      const commentsCount: string[] = await this.client.HMGET(`post:${postId}`, 'commentsCount');
      let count: number = Helper.parseJson(`${commentsCount[0]}`) as number;
      count -= 1;
      await this.client.HSET(`post:${postId}`, 'commentsCount', count);
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

}
