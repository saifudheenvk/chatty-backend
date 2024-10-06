import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { socketIOChatObject } from '@sockets/chat';
import { chatQueue } from '@services/queues/chat.queue';
import { ChatCache } from '@services/redis/chat.cache';

const chatCache: ChatCache = new ChatCache();

export class Message {
  public async reaction(req: Request, res: Response): Promise<void> {
    const { conversationId, messageId, reaction, type } = req.body;
    const updatedMessage: IMessageData = await chatCache.updateMessageReaction(
      `${conversationId}`,
      `${messageId}`,
      `${reaction}`,
      `${req.currentUser!.username}`,
      type
    );
    socketIOChatObject.emit('message reaction', updatedMessage);
    chatQueue.addChatData('updateMessageReaction', {
      messageId: new mongoose.Types.ObjectId(messageId),
      senderName: req.currentUser!.username,
      reaction,
      type
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Message reaction added' });
  }
}
