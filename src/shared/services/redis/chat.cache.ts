import { ServerError } from '@global/helpers/error-handler';
import { BaseCache } from './base.cache';
import { filter, find, findIndex, remove } from 'lodash';
import { IChatList, IChatUsers, IMessageData } from '@chat/interfaces/chat.interface';
import { Helper } from '@global/helpers/helper';
import { IReaction } from '@reaction/interfaces/reaction.interface';



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

  // if user one clicks a user name to chat from chat list, we will add an entry like this. And when he leaves the chat, we will remove it
  public async addChatUsersToCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const chatUsers: IChatUsers[] = await this.getChatUsers();
      const usersIndex: number = findIndex(chatUsers, (listItem: IChatUsers) => JSON.stringify(listItem) === JSON.stringify(value));
      let users: IChatUsers[] = [];
      if(usersIndex < 0) {
        await this.client.RPUSH('chatUsers', JSON.stringify(value));
        users = await this.getChatUsers();
      } else {
        users = chatUsers;
      }
      return users;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async removeChatUsersFromCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      let chatUsers: IChatUsers[] = await this.getChatUsers();
      const userIndex: number = findIndex(chatUsers, (listItem: IChatUsers) => JSON.stringify(listItem) === JSON.stringify(value));
      if(userIndex >= 0) {
        await this.client.LREM('chatUsers', 1, JSON.stringify(value));
        chatUsers = await this.getChatUsers();
      } 
      return chatUsers;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getConversationListFromCache(senderId: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const chatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const response: IMessageData[] = [];
      for(const chat of chatList) {
        const chatData: IMessageData = JSON.parse(chat);
        const message: string = await this.client.LINDEX(`messages:${chatData.conversationId}`, -1) as string; //latest message
        response.push(Helper.parseJson(message));
      }
      return response;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getChatMessagesFromCache(recieverId: string, senderId: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const reciever: string = find(userChatList, (listItem: string) => listItem.includes(recieverId)) as string;
      const parsedReciever: IChatList = Helper.parseJson(reciever) as IChatList;
      if(parsedReciever) {
        const messages = await this.client.LRANGE(`messages:${parsedReciever.conversationId}`, 0, -1);
        const parsedMessages: IMessageData[] = messages.map((message: string) => Helper.parseJson(message));
        return parsedMessages;
      } else {
        return [];
      }
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateChatMessages(sender: string, reciever: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const userChatList: string[] = await this.client.LRANGE(`chatList:${sender}`, 0, -1);
      const recieverData: string = find(userChatList, (listItem: string) => listItem.includes(reciever)) as string;
      const parsedReciever: IChatList = Helper.parseJson(recieverData) as IChatList;
      const messages: string[] = await this.client.LRANGE(`messages:${parsedReciever.conversationId}`, 0, -1);
      const unReadMessages: string[] = filter(messages, (message: string) => !Helper.parseJson(message).isRead);
      for(const message of unReadMessages) {
        const parsedMessage: IMessageData = Helper.parseJson(message) as IMessageData;
        parsedMessage.isRead = true;
        const itemIndex: number = findIndex(messages, (listItem: string) => listItem.includes(`${parsedMessage._id}`));
        await this.client.LSET(`messages:${parsedMessage.conversationId}`, itemIndex, JSON.stringify(parsedMessage));
      }
      const lastMessage: string = await this.client.LINDEX(`messages:${parsedReciever.conversationId}`, -1) as string;
      const parsedLastMessage: IMessageData = Helper.parseJson(lastMessage) as IMessageData;
      return parsedLastMessage;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async markMessageAsDeleted(senderId: string, recieverId: string, messageId: string, type: string): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);
      const reciever: string = find(userChatList, (listItem: string) => listItem.includes(recieverId)) as string;
      const parsedReciever: IChatList = Helper.parseJson(reciever) as IChatList;
      const messages: string[] = await this.client.LRANGE(`messages:${parsedReciever.conversationId}`, 0, -1);
      const itemIndex: number = findIndex(messages, (listItem: string) => listItem.includes(`${messageId}`));
      const parsedMessage: IMessageData = Helper.parseJson(messages[itemIndex]) as IMessageData;
      if (type === 'deleteForMe') {
        parsedMessage.deleteForMe = true;
      } else {
        parsedMessage.deleteForMe = true;
        parsedMessage.deleteForEveryone = true;
      }
      await this.client.LSET(`messages:${parsedReciever.conversationId}`, itemIndex, JSON.stringify(parsedMessage));
      const lastMessage: string = await this.client.LINDEX(`messages:${parsedReciever.conversationId}`, -1) as string;
      const parsedLastMessage: IMessageData = Helper.parseJson(lastMessage) as IMessageData;
      return parsedLastMessage;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateMessageReaction(conversationId: string, messageId: string, reaction: string, senderName: string, type: 'add' | 'remove'): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const messages: string[] = await this.client.LRANGE(`messages:${conversationId}`, 0, -1);
      const itemIndex: number = findIndex(messages, (listItem: string) => listItem.includes(`${messageId}`));
      const parsedMessage: IMessageData = Helper.parseJson(messages[itemIndex]) as IMessageData;
      remove(parsedMessage.reaction, (reaction: IReaction) => reaction.senderName === senderName);
      if(type === 'add') {
        parsedMessage.reaction.push({ senderName, type: reaction });
      }
      await this.client.LSET(`messages:${conversationId}`, itemIndex, JSON.stringify(parsedMessage));
      const lastMessage: string = await this.client.LINDEX(`messages:${conversationId}`, -1) as string;
      const parsedLastMessage: IMessageData = Helper.parseJson(lastMessage) as IMessageData;
      return parsedLastMessage;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  private async getChatUsers(): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE('chatUsers', 0, -1);
      const users: IChatUsers[] = response.map((user) => Helper.parseJson(user));
      return users;
    } catch (error) {
      this.logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
