import { Add } from '@chat/controllers/add-chat';
import { Message } from '@chat/controllers/add-message-reaction';
import { Delete } from '@chat/controllers/delete-chat-messages';
import { Get } from '@chat/controllers/get-chat-messages';
import { Update } from '@chat/controllers/update-chat-messages';
import { authMiddleware } from '@global/helpers/auth-middleware';
import express, { Router } from 'express';



class ChatRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
    this.router.get('/chat/message/conversation-list', authMiddleware.checkAuthentication, Get.prototype.conversationList);
    this.router.get('/chat/message/user/:receiverId', authMiddleware.checkAuthentication, Get.prototype.messages);
    this.router.post('/chat/message', authMiddleware.checkAuthentication, Add.prototype.message);
    this.router.post('/chat/message/add-chat-users', authMiddleware.checkAuthentication, Add.prototype.addChatUsers);
    this.router.post('/chat/message/remove-chat-users', authMiddleware.checkAuthentication, Add.prototype.removeChatUsers);
    this.router.put('/chat/message/mark-as-read', authMiddleware.checkAuthentication, Update.prototype.message);
    this.router.put('/chat/message/reaction', authMiddleware.checkAuthentication, Message.prototype.reaction);
    this.router.delete(
      '/chat/message/mark-as-deleted/:messageId/:senderId/:receiverId/:type',
      authMiddleware.checkAuthentication,
      Delete.prototype.message
    );
    
    return this.router;
  }
}

export const chatRoutes = new ChatRoutes;
