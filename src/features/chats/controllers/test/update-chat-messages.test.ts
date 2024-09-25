import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { Update } from '@chat/controllers/update-chat-messages';
import { Server } from 'socket.io';
import * as chatServer from '@sockets/chat';
import { chatMockRequest, chatMockResponse } from '@root/mocks/chat.mock';
import { existingUser } from '@root/mocks/user.mock';
import { chatQueue } from '@services/queues/chat.queue';
import { messageDataMock } from '@root/mocks/chat.mock';
import { ChatCache } from '@services/redis/chat.cache';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/chat.cache');

Object.defineProperties(chatServer, {
  socketIOChatObject: {
    value: new Server(),
    writable: true
  }
});

describe('Update', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('message', () => {
    it('should send correct json response from redis cache', async () => {
      const req: Request = chatMockRequest(
        {},
        {
          senderId: `${existingUser._id}`,
          receiverId: '60263f14648fed5246e322d8'
        },
        authUserPayload
      ) as Request;
      const res: Response = chatMockResponse();
      jest.spyOn(ChatCache.prototype, 'updateChatMessages').mockResolvedValue(messageDataMock);
      jest.spyOn(chatServer.socketIOChatObject, 'emit');

      await Update.prototype.message(req, res);
      expect(chatServer.socketIOChatObject.emit).toHaveBeenCalledTimes(2);
      expect(chatServer.socketIOChatObject.emit).toHaveBeenCalledWith('message read', messageDataMock);
      expect(chatServer.socketIOChatObject.emit).toHaveBeenCalledWith('chat list', messageDataMock);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message marked as read'
      });
    });

    it('should call chatQueue addChatJob', async () => {
      const req: Request = chatMockRequest(
        {},
        {
          senderId: `${existingUser._id}`,
          receiverId: '60263f14648fed5246e322d8'
        },
        authUserPayload
      ) as Request;
      const res: Response = chatMockResponse();
      jest.spyOn(ChatCache.prototype, 'updateChatMessages').mockResolvedValue(messageDataMock);
      jest.spyOn(chatQueue, 'addChatData');

      await Update.prototype.message(req, res);
      expect(chatQueue.addChatData).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Message marked as read'
      });
    });
  });
});
