import { IFollowerData } from '@follower/interfaces/follower.interface';
import { Helper } from '@global/helpers/helper';
import { IPostDocument } from '@post/interfaces/post.interface';
import { followerService } from '@services/db/follower.service';
import { postService } from '@services/db/post.service';
import { userService } from '@services/db/user.service';
import { FollowerCache } from '@services/redis/follower.cache';
import { PostCache } from '@services/redis/post.cache';
import { UserCache } from '@services/redis/user.cache';
import { IAllUsers, IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';


const PAGE_SIZE = 12;

interface IUserAll {
  newSkip: number;
  limit: number;
  skip: number;
  userId: string;
}


const userCache: UserCache = new UserCache();
const followerCache: FollowerCache = new FollowerCache();
const postCache: PostCache = new PostCache();

export class Get {
  public async all(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;
    const limit = PAGE_SIZE * parseInt(page);
    const newSkip = skip === 0? skip : skip + 1;
    const allUsers: IAllUsers = await Get.prototype.getAllUsers({ newSkip, limit, skip, userId: `${req.currentUser?.userId}` });
    const followers: IFollowerData[] = await Get.prototype.followers(`${req.currentUser!.userId}`);
    res.status(HTTP_STATUS.OK).json({ message: 'Get users', users:  allUsers.users, totalUsers: allUsers.totalUsers, followers });
  }

  public async profile(req: Request, res: Response): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser!.userId}`);
    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile', user: existingUser });
  }

  public async profileByUserId(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(userId);
    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile by id', user: existingUser });
  }

  public async profileAndPosts(req: Request, res: Response): Promise<void> {
    const { userId, username, uId } = req.params;
    const userName: string = Helper.convertFirstLetterUppercase(username);
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument;
    const cachedUserPosts: IPostDocument[] = await postCache.getUserPostsFromCache('post', parseInt(uId, 10));

    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(userId);
    const userPosts: IPostDocument[] = cachedUserPosts.length
      ? cachedUserPosts
      : await postService.getPosts({ username: userName }, 0, 100, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({ message: 'Get user profile and posts', user: existingUser, posts: userPosts });
  }

  public async randomUserSuggestions(req: Request, res: Response): Promise<void> {
    let randomUsers: IUserDocument[] = [];
    const cachedUsers: IUserDocument[] = await userCache.getRandomUsersFromCache(`${req.currentUser!.userId}`, req.currentUser!.username);
    if (cachedUsers.length) {
      randomUsers = [...cachedUsers];
    } else {
      const users: IUserDocument[] = await userService.getRandomUsers(req.currentUser!.userId);
      randomUsers = [...users];
    }
    res.status(HTTP_STATUS.OK).json({ message: 'User suggestions', users: randomUsers });
  }

  private async getAllUsers(data: IUserAll): Promise<IAllUsers> {
    let users: IUserDocument[] = [];
    let type = '';
    const cachedUsers: IUserDocument[] = await userCache.getUsersFromCache(data.newSkip, data.limit, data.userId) as IUserDocument[];
    if (cachedUsers.length) {
      type = 'redis';
      users = cachedUsers;
    } else {
      type = 'mongodb';
      users = await userService.getAllUsers(data.userId, data.skip, data.limit) as IUserDocument[];
    }
    const totalUsers: number = await Get.prototype.getUsersCount(type);
    return { users, totalUsers};
  }

  private async getUsersCount(type: string): Promise<number> {
    const count: number = type === 'redis'? await userCache.getTotalUsersInCache() : await userService.getTotalUsersInDB();
    return count;
  }

  private async followers(userId: string): Promise<IFollowerData[]> {
    const cachedFollowers: IFollowerData[] = await followerCache.getFollowersFromCache(`follower:${userId}`);
    const followers: IFollowerData[] = cachedFollowers.length ? cachedFollowers : await followerService.getFollowersFromDB(userId);
    return followers;
  }
}
