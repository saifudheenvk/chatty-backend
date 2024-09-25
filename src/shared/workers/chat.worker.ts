import { config } from '@root/config';
import { chatService } from '@services/db/chat.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';


const logger: Logger = config.createLogger('chatWorker');

class ChatWorker {
  public async addChatDataToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data = job.data;
      await chatService.addMessageToDB(data);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }

  public async markMessagesAsReadInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data = job.data;
      await chatService.markMessagesAsReadInDB(data.senderId, data.receiverId);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }

  public async markMessageAsDeletedInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const data = job.data;
      await chatService.markMessageAsDeletedInDB(data.messageId, data.type);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }

  public async updateMessageReaction(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { messageId, senderName, reaction, type } = job.data;
      await chatService.updateMessageReaction(messageId, senderName, reaction, type);
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }
}


export const chatWorker: ChatWorker = new ChatWorker();
