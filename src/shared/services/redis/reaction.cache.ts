import { ServerError } from '@global/helpers/error-handler';
import { Helper } from '@global/helpers/helper';
import { IReactionDocument, IReactions } from '@reaction/interfaces/reaction.interface';
import { BaseCache } from '@services/redis/base.cache';
import { find } from 'lodash';




export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionCache');
  }

  public async saveReactionsToCache(key: string, type: string, reactionDocument: IReactionDocument, postReactions: IReactions, prevReaction: string): Promise<void> {
    try {
      if(!this.client.isOpen) {
        this.client.connect();
      }
      if(prevReaction) {
        await this.removePostReactionFromCache(key, reactionDocument.username, postReactions);
      }

      if(type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reactionDocument));
        await this.client.HSET(`post:${key}`, 'reactions', JSON.stringify(postReactions));
      }
      
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error, Try again');
    }
  }

  public async removePostReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {
    try {
      if(!this.client.isOpen) {
        this.client.connect();
      }

      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
      const userPrevReaction: IReactionDocument = this.getPreviousReaction(response, username) as IReactionDocument;
      await this.client.LREM(`reactions:${key}`, 1, JSON.stringify(userPrevReaction));
      await this.client.HSET(`post:${key}`, 'reactions', JSON.stringify(postReactions));
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error, Try again');
    }
  }

  public async getPostReactionsFromCache(postId: string): Promise<[IReactionDocument[], number]> {
    try {
      if(!this.client.isOpen) {
        this.client.connect();
      }
      const reactionsCount: number = await this.client.LLEN(`reactions:${postId}`);
      const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const reactions: IReactionDocument[] = [];
      for (const item of response) {
        reactions.push(Helper.parseJson(item));
      }
      return response.length ? [reactions, reactionsCount] : [[], 0];
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error, Try again');
    }
  }

  public async getSingleReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const list: IReactionDocument[] = [];
      for (const item of response) {
        list.push(Helper.parseJson(item));
      }
      const result: IReactionDocument = find(list, (listItem: IReactionDocument) => {
        return listItem?.postId === postId && listItem?.username === username;
      }) as IReactionDocument;

      return result ? [result, 1] : [];
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  private getPreviousReaction(response: string[], username: string): IReactionDocument | undefined {
    const list: IReactionDocument[] = [];
    for (const item of response) {
      list.push(Helper.parseJson(item) as IReactionDocument);
    }
    return find(list, (listItem: IReactionDocument) => {
      return listItem.username === username;
    });
  }
  
}

