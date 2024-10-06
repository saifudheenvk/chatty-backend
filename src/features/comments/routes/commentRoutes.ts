import { Add } from '@comments/controllers/add-comments';
import { Get } from '@comments/controllers/get-comments';
import { authMiddleware } from '@global/helpers/auth-middleware';
import express, { Router } from 'express';



class CommentRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
    this.router.post('/post', authMiddleware.checkAuthentication, Add.prototype.add);
  
    this.router.get('/post/:postId', authMiddleware.checkAuthentication, Get.prototype.comments);
    this.router.get('/post/single/:postId/:commentId', authMiddleware.checkAuthentication, Get.prototype.singleComment);
    this.router.get('/post/names/:postId', authMiddleware.checkAuthentication, Get.prototype.getCommentNames);

    return this.router;
  }
}

export const commentRoutes = new CommentRoutes;
