import { Request, Response } from 'express';
import { authMockRequest, authMockResponse, authUserPayload } from '@root/mocks/auth.mock';
import { UserCache } from '@services/redis/user.cache';
import { FollowerCache } from '@services/redis/follower.cache';
import { existingUser } from '@root/mocks/user.mock';
import { Get } from '@user/controllers/get-profile';
import { PostCache } from '@services/redis/post.cache';
import { postMockData } from '@root/mocks/post.mock';
import { followerService } from '@services/db/follower.service';
import { userService } from '@services/db/user.service';
import { postService } from '@services/db/post.service';
import { Helper } from '@global/helpers/helper';
import { mockFollowerData } from '@mocks/follower.mock';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/post.cache');
jest.mock('@services/redis/follower.cache');
jest.mock('@services/redis/user.cache');
jest.mock('@services/db/user.service');
jest.mock('@services/db/follower.service');

describe('Get', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('all', () => {
    it('should send success json response if users in cache', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload, { page: '1' }) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUsersFromCache').mockResolvedValue([existingUser]);
      jest.spyOn(UserCache.prototype, 'getTotalUsersInCache').mockResolvedValue(1);
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([mockFollowerData]);
      await Get.prototype.all(req, res);
      expect(FollowerCache.prototype.getFollowersFromCache).toHaveBeenCalledWith(`follower:${req.currentUser!.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get users',
        users: [existingUser],
        followers: [mockFollowerData],
        totalUsers: 1
      });
    });

    it('should send success json response if users in database', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload, { page: '1' }) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUsersFromCache').mockResolvedValue([]);
      jest.spyOn(UserCache.prototype, 'getTotalUsersInCache').mockResolvedValue(0);
      jest.spyOn(FollowerCache.prototype, 'getFollowersFromCache').mockResolvedValue([]);
      jest.spyOn(followerService, 'getFollowersFromDB').mockResolvedValue([mockFollowerData]);
      jest.spyOn(userService, 'getAllUsers').mockResolvedValue([existingUser]);
      jest.spyOn(userService, 'getTotalUsersInDB').mockResolvedValue(1);

      await Get.prototype.all(req, res);
      expect(followerService.getFollowersFromDB).toHaveBeenCalledWith(`${req.currentUser!.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get users',
        users: [existingUser],
        followers: [mockFollowerData],
        totalUsers: 1
      });
    });
  });

  describe('profile', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(existingUser);
      await Get.prototype.profile(req, res);
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledWith(`${req.currentUser?.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile',
        user: existingUser
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(null);
      jest.spyOn(userService, 'getUserById').mockResolvedValue(existingUser);

      await Get.prototype.profile(req, res);
      expect(userService.getUserById).toHaveBeenCalledWith(`${req.currentUser?.userId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile',
        user: existingUser
      });
    });
  });

  describe('profileAndPosts', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload, {
        username: existingUser.username,
        userId: existingUser._id,
        uId: existingUser.uId
      }) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(existingUser);
      jest.spyOn(PostCache.prototype, 'getUserPostsFromCache').mockResolvedValue([postMockData]);

      await Get.prototype.profileAndPosts(req, res);
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledWith(`${req.currentUser?.userId}`);
      expect(PostCache.prototype.getUserPostsFromCache).toHaveBeenCalledWith('post', parseInt(req.params.uId, 10));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile and posts',
        user: existingUser,
        posts: [postMockData]
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload, {
        username: existingUser.username,
        userId: existingUser._id,
        uId: existingUser.uId
      }) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(null);
      jest.spyOn(PostCache.prototype, 'getUserPostsFromCache').mockResolvedValue([]);
      jest.spyOn(userService, 'getUserById').mockResolvedValue(existingUser);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([postMockData]);

      const userName: string = Helper.convertFirstLetterUppercase(req.params.username);

      await Get.prototype.profileAndPosts(req, res);
      expect(userService.getUserById).toHaveBeenCalledWith(existingUser._id);
      expect(postService.getPosts).toHaveBeenCalledWith({ username: userName }, 0, 100, { createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile and posts',
        user: existingUser,
        posts: [postMockData]
      });
    });
  });

  describe('profileByUserId', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload, {
        userId: existingUser._id
      }) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(existingUser);

      await Get.prototype.profileByUserId(req, res);
      expect(UserCache.prototype.getUserFromCache).toHaveBeenCalledWith(req.params.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile by id',
        user: existingUser
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload, {
        userId: existingUser._id
      }) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(null);
      jest.spyOn(userService, 'getUserById').mockResolvedValue(existingUser);

      await Get.prototype.profileByUserId(req, res);
      expect(userService.getUserById).toHaveBeenCalledWith(req.params.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get user profile by id',
        user: existingUser
      });
    });
  });

  describe('randomUserSuggestions', () => {
    it('should send success json response if user in cache', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getRandomUsersFromCache').mockResolvedValue([existingUser]);

      await Get.prototype.randomUserSuggestions(req, res);
      expect(UserCache.prototype.getRandomUsersFromCache).toHaveBeenCalledWith(
        `${req.currentUser?.userId}`,
        `${req.currentUser?.username}`
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User suggestions',
        users: [existingUser]
      });
    });

    it('should send success json response if user in database', async () => {
      const req: Request = authMockRequest({}, {}, authUserPayload) as Request;
      const res: Response = authMockResponse();
      jest.spyOn(UserCache.prototype, 'getRandomUsersFromCache').mockResolvedValue([]);
      jest.spyOn(userService, 'getRandomUsers').mockResolvedValue([existingUser]);

      await Get.prototype.randomUserSuggestions(req, res);
      expect(userService.getRandomUsers).toHaveBeenCalledWith(req.currentUser!.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User suggestions',
        users: [existingUser]
      });
    });
  });
});