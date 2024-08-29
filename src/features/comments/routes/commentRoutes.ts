import { Add } from '@comments/controllers/add-comments';
import { Get } from '@comments/controllers/get-comments';
import express, { Router } from 'express';



class CommentRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
    this.router.post('/post', Add.prototype.add);
  
    this.router.get('/post/:postId', Get.prototype.comments);
    this.router.get('/post/single/:postId/:commentId', Get.prototype.singleComment);
    this.router.get('/post/names/:postId', Get.prototype.getCommentNames);

    return this.router;
  }
}

export const commentRoutes = new CommentRoutes;
