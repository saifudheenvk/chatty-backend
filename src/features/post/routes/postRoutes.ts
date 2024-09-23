import { authMiddleware } from '@global/helpers/auth-middleware';
import { Create } from '@post/controllers/create-post';
import { Delete } from '@post/controllers/delete-post';
import { Get } from '@post/controllers/get-posts';
import { Update } from '@post/controllers/update-post';
import express, { Router } from 'express';

class PostRotes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('', authMiddleware.checkAuthentication, Create.prototype.post);
    this.router.post('/image/post', authMiddleware.checkAuthentication, Create.prototype.postWithImage);
    
    this.router.get('/:page', authMiddleware.checkAuthentication, Get.prototype.posts);
    this.router.get('/images/:page', authMiddleware.checkAuthentication, Get.prototype.postsWithImages);

    this.router.delete('/:postId', authMiddleware.checkAuthentication, Delete.prototype.delete);

    this.router.put('/:postId', authMiddleware.checkAuthentication, Update.prototype.update);
    this.router.put('/image/:postId', authMiddleware.checkAuthentication, Update.prototype.postWithImage);


    return this.router;
  }
}

export const postRoutes = new PostRotes();
