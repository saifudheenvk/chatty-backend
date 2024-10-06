import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { followersMockRequest, followersMockResponse } from '@mocks/follower.mock';
import { followerQueue } from '@services/queues/follow.queue';
import { FollowerCache } from '@services/redis/follower.cache';
import { Unfollow } from '@follower/controllers/unfollow-user';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/follower.cache');

describe('Remove', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should send correct json response', async () => {
    const req: Request = followersMockRequest({}, authUserPayload, {
      followerId: '6064861bc25eaa5a5d2f9bf4'
    }) as Request;
    const res: Response = followersMockResponse();
    jest.spyOn(FollowerCache.prototype, 'removeFromFollowersCache');
    jest.spyOn(FollowerCache.prototype, 'updateFolloersCountInCache');
    jest.spyOn(followerQueue, 'addFollowerJob');

    await Unfollow.prototype.unfollowUser(req, res);
    expect(FollowerCache.prototype.removeFromFollowersCache).toHaveBeenCalledTimes(2);
    expect(FollowerCache.prototype.removeFromFollowersCache).toHaveBeenCalledWith(
      `following:${req.currentUser!.userId}`,
      req.params.followerId
    );
    expect(FollowerCache.prototype.removeFromFollowersCache).toHaveBeenCalledWith(
      `follower:${req.params.followerId}`,
      `${req.currentUser!.userId}`
    );
    expect(FollowerCache.prototype.updateFolloersCountInCache).toHaveBeenCalledTimes(2);
    expect(FollowerCache.prototype.updateFolloersCountInCache).toHaveBeenCalledWith(`${req.params.followerId}`, 'followersCount', -1);
    expect(FollowerCache.prototype.updateFolloersCountInCache).toHaveBeenCalledWith(`${req.currentUser!.userId}`, 'followingCount', -1);
    expect(followerQueue.addFollowerJob).toHaveBeenCalledWith('removeFollowerFromDB', {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${req.params.followerId}`
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unfollowed successfully'
    });
  });
});
