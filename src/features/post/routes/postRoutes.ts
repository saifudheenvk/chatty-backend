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
    this.router.post('', Create.prototype.post);
    this.router.post('/image/post', Create.prototype.postWithImage);
    
    this.router.get('/:page', Get.prototype.posts);
    this.router.get('/images/:page', Get.prototype.postsWithImages);

    this.router.delete('/:postId', Delete.prototype.delete);

    this.router.put('/:postId', Update.prototype.update);
    this.router.put('/image/:postId', Update.prototype.postWithImage);


    return this.router;
  }
}

export const postRoutes = new PostRotes();
