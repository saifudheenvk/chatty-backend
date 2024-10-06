import { authMiddleware } from '@global/helpers/auth-middleware';
import { Add } from '@reaction/controllers/add-reactions';
import { Get } from '@reaction/controllers/get-reactions';
import { Remove } from '@reaction/controllers/remove-reaction';
import express, { Router } from 'express';



class ReactionRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
    this.router.get('/post/:postId', authMiddleware.checkAuthentication, Get.prototype.reactions);
    this.router.get('/post/username/single/:postId/:username', authMiddleware.checkAuthentication, Get.prototype.singleReactionByUsername);
    this.router.get('/post/username/:username', authMiddleware.checkAuthentication, Get.prototype.reactionsByUsername);


    this.router.post('/post', authMiddleware.checkAuthentication, Add.prototype.add);
    this.router.delete('/post/:postId/:previousReaction/:postReactions', authMiddleware.checkAuthentication, Remove.prototype.remove);

    return this.router;
  }
}

export const reactionRoutes = new ReactionRoutes;
