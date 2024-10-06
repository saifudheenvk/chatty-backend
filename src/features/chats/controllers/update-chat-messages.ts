import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { markChatSchema } from '@chat/schemes/chat';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { socketIOChatObject } from '@sockets/chat';
import { chatQueue } from '@services/queues/chat.queue';
import { ChatCache } from '@services/redis/chat.cache';

const chatCache: ChatCache = new ChatCache();

export class Update {
  @JoiValidation(markChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId } = req.body;
    const updatedMessage: IMessageData = await chatCache.updateChatMessages(`${senderId}`, `${receiverId}`);
    socketIOChatObject.emit('message read', updatedMessage);
    socketIOChatObject.emit('chat list', updatedMessage);
    chatQueue.addChatData('markMessagesAsReadInDB', {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId)
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as read' });
  }
}
