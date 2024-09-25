import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { socketIOChatObject } from '@sockets/chat';
import { chatQueue } from '@services/queues/chat.queue';
import { ChatCache } from '@services/redis/chat.cache';

const chatCache: ChatCache = new ChatCache();

export class Delete {
  public async message(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.params;
    const updatedMessage: IMessageData = await chatCache.markMessageAsDeleted(`${senderId}`, `${receiverId}`, `${messageId}`, type);
    socketIOChatObject.emit('message read', updatedMessage);
    socketIOChatObject.emit('chat list', updatedMessage);
    chatQueue.addChatData('markMessageAsDeletedInDB', {
      messageId: new mongoose.Types.ObjectId(messageId),
      type
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as deleted' });
  }
}
