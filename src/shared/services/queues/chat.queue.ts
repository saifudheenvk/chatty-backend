import { chatWorker } from '@workers/chat.worker';
import { BaseQueue } from './base.queue';
import { IChatJobData, IMessageData } from '@chat/interfaces/chat.interface';




class ChatQueue extends BaseQueue {
  constructor() {
    super('Chat');
    this.processJob('addChatMessageToDB', 5, chatWorker.addChatDataToDB);
    this.processJob('markMessagesAsReadInDB', 5, chatWorker.markMessagesAsReadInDB);
    this.processJob('markMessageAsDeletedInDB', 5, chatWorker.markMessageAsDeletedInDB);
    this.processJob('updateMessageReaction', 5, chatWorker.updateMessageReaction);
  }

  public addChatData(name: string, data: IMessageData | IChatJobData){
    return this.addQueue(name, data);
  }
}

export const chatQueue: ChatQueue = new ChatQueue();
