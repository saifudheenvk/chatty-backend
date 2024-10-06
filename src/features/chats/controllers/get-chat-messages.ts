import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { IMessageData } from '@chat/interfaces/chat.interface';
import { ChatCache } from '@services/redis/chat.cache';
import { chatService } from '@services/db/chat.service';
import mongoose from 'mongoose';



const chatChache: ChatCache = new ChatCache();

export class Get {

  public async conversationList(req: Request, res: Response): Promise<void> {
    let list: IMessageData[] = [];
    const cachedList: IMessageData[] = await chatChache.getConversationListFromCache(`${req.currentUser!.userId}`);
    list = cachedList.length ? cachedList : (await chatService.getUserConversationList(new mongoose.Types.ObjectId(req.currentUser!.userId))) as IMessageData[];
    
    res.status(HTTP_STATUS.OK).json({ message: 'User conversation list', list });
  }
  public async messages(req: Request, res: Response): Promise<void> {
    const { receiverId } = req.params;
    const cachedMessages: IMessageData[] = await chatChache.getChatMessagesFromCache(receiverId, `${req.currentUser!.userId}`);
    const messages: IMessageData[] = cachedMessages.length ? cachedMessages : await chatService.getMessages(new mongoose.Types.ObjectId(req.currentUser!.userId), new mongoose.Types.ObjectId(receiverId));
    res.status(HTTP_STATUS.OK).json({ message: 'User chat messages', messages });
  }
}
