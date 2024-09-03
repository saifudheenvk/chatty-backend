import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { followersMockRequest, followersMockResponse, mockFollowerData } from '@mocks/follower.mock';
import { FollowerCache } from '@services/redis/follower.cache';
import { GetFollower } from '@follower/controllers/get-followers';
import { followerService } from '@services/db/follower.service';
import { existingUserTwo } from '@root/mocks/user.mock';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/follower.cache');

describe('Get', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('userFollowing', () => {
    it('should send correct json response if user following exist in cache', async () => {
      const req: Request = followersMockRequest({}, authUserPayload) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([mockFollowerData]);

      await GetFollower.prototype.followings(req, res);
      expect(FollowerCache.prototype.getFollowersFromCache).toBeCalledWith(`following:${req.currentUser!.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user followings',
        followings: [mockFollowerData]
      });
    });

    it('should send correct json response if user following exist in database', async () => {
      const req: Request = followersMockRequest({}, authUserPayload) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([]);
      jest.spyOn(followerService, 'getFolloyeesFromDB').mockResolvedValue([mockFollowerData]);

      await GetFollower.prototype.followings(req, res);
      expect(followerService.getFolloyeesFromDB).toHaveBeenCalledWith(req.currentUser!.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user followings',
        followings: [mockFollowerData]
      });
    });

    it('should return empty following if user following does not exist', async () => {
      const req: Request = followersMockRequest({}, authUserPayload) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([]);
      jest.spyOn(followerService, 'getFolloyeesFromDB').mockResolvedValue([]);

      await GetFollower.prototype.followings(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user followings',
        followings: []
      });
    });
  });

  describe('userFollowers', () => {
    it('should send correct json response if user follower exist in cache', async () => {
      const req: Request = followersMockRequest({}, authUserPayload, { userId: `${existingUserTwo._id}` }) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([mockFollowerData]);

      await GetFollower.prototype.followers(req, res);
      expect(FollowerCache.prototype.getFollowersFromCache).toBeCalledWith(`follower:${req.params.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user followers',
        followers: [mockFollowerData]
      });
    });

    it('should send correct json response if user following exist in database', async () => {
      const req: Request = followersMockRequest({}, authUserPayload, { userId: `${existingUserTwo._id}` }) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([]);
      jest.spyOn(followerService, 'getFollowersFromDB').mockResolvedValue([mockFollowerData]);

      await GetFollower.prototype.followers(req, res);
      expect(followerService.getFollowersFromDB).toHaveBeenCalledWith(req.params.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user followers',
        followers: [mockFollowerData]
      });
    });

    it('should return empty following if user following does not exist', async () => {
      const req: Request = followersMockRequest({}, authUserPayload, { userId: `${existingUserTwo._id}` }) as Request;
      const res: Response = followersMockResponse();
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([]);
      jest.spyOn(followerService, 'getFollowersFromDB').mockResolvedValue([]);

      await GetFollower.prototype.followers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All user followers',
        followers: []
      });
    });
  });
});
