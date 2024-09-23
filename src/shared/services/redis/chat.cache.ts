import { ServerError } from '@global/helpers/error-handler';
import { BaseCache } from './base.cache';
import { findIndex } from 'lodash';
import { IMessageData } from '@chat/interfaces/chat.interface';



export class ChatCache extends BaseCache {
  constructor() {
    super('chatCache');
  }

  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const chatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      if(chatList.length === 0) {
        await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));  //if you use LPUSH it will be in reverse, so we should sort it. RPUSH will give proper order
      } else {
        const chatListIndex: number = findIndex(chatList, (listItem: string) => listItem.includes(receiverId));
        if(chatListIndex < 0) { // this means sender has chat list with other users but not with this receiver
          await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }));
        }
      }
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async addChatMessageToCache(conversationId: string, data: IMessageData): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.RPUSH(`messages:${conversationId}`, JSON.stringify(data));
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
