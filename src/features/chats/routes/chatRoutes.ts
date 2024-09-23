import { Add } from '@chat/controllers/add-chat';
import { authMiddleware } from '@global/helpers/auth-middleware';
import express, { Router } from 'express';



class ChatRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
    this.router.post('/chat/message', authMiddleware.checkAuthentication, Add.prototype.message);
    this.router.post('/chat/message/add-chat-users', authMiddleware.checkAuthentication, Add.prototype.addChatUsers);
    this.router.post('/chat/message/remove-chat-users', authMiddleware.checkAuthentication, Add.prototype.removeChatUsers);
    
    return this.router;
  }
}

export const chatRoutes = new ChatRoutes;
