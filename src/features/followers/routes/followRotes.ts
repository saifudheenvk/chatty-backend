import { Block } from '@follower/controllers/block-user';
import { Follow } from '@follower/controllers/follow-user';
import { GetFollower } from '@follower/controllers/get-followers';
import { Unfollow } from '@follower/controllers/unfollow-user';
import express, { Router } from 'express';



class FollowRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
    this.router.put('/user/follow/:followerId', Follow.prototype.followUser);
    this.router.put('/user/unfollow/:followerId', Unfollow.prototype.unfollowUser);

    this.router.put('/user/block/:userId', Block.prototype.blockUser);
    this.router.put('/user/unblock/:userId', Block.prototype.unblockUser);

    this.router.get('/user/followers/:userId', GetFollower.prototype.followers);
    this.router.get('/user/followings', GetFollower.prototype.followings);
    return this.router;
  }
}

export const followRoutes = new FollowRoutes;
