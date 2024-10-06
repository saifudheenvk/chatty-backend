import { IBasicInfo, INotificationSettings, ISearchUser, ISocialLinks, IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';
import { followerService } from '@services/db/follower.service';
import  { indexOf } from 'lodash';
import { AuthModel } from '@auth/models/auth.schema';

class UserService {
  public async createUser(data: IUserDocument): Promise<void> {
    await UserModel.create(data);
  }

  public async getUserByAuthId(authId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }

  public async getUserById(userId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }

  public async getAllUsers(userId: string, start: number, end: number): Promise<IUserDocument[]> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $skip: start },
      { $limit: end - start },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId'}},
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);
    return users;
  }

  public async getTotalUsersInDB(): Promise<number> {
    const count: number = await UserModel.find({}).countDocuments();
    return count;
  }

  public async getRandomUsers(userId: string): Promise<IUserDocument[]> {
    const randomUsers: IUserDocument[] = [];
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId'}},
      { $unwind: '$authId' },
      { $sample: { size: 10 } }, // get 10 random users
      { $project: this.aggregateProject() }
    ]);
    const followers: string[] = await followerService.getFolloweesIds(`${userId}`);

    for (const user of users) {
      const followerIndex = indexOf(followers, user._id.toString());
      if (followerIndex < 0) {
        randomUsers.push(user);
      }
    }
    return randomUsers;
  }
  

  // username exists in AuthModel not in UserModel that is why we are using AuthModel
  public async searchUsers(regex: RegExp): Promise<ISearchUser[]> {
    const users: ISearchUser[] = await AuthModel.aggregate([
      { $match: { username: regex } },
      { $lookup: { from: 'User', localField: '_id', foreignField: 'authId', as: 'user'}},
      { $unwind: '$user' },
      { $project: {
        _id: '$user._id',
        username: 1,
        avatarColor: 1,
        profilePicture: 1,
        email: 1,
      }}
    ]);
    return users;
  }

  public async updatePassword(username: string, hashedPassword: string): Promise<void> {
    await AuthModel.updateOne({ username: username }, { $set: { password: hashedPassword } }).exec();
  }

  public async updateBasicInfoInDB(userId: string, value: IBasicInfo): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: {
      work: value['work'],
      school: value['school'],
      quote: value['quote'],
      location: value['location']
    } }).exec();
  }

  public async updateSocialLinks(userId: string, links: ISocialLinks): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: { social: links }
      }
    ).exec();
  }

  public async updateNotificationSettings(userId: string, notifications: INotificationSettings): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { notifications: notifications } }
    ).exec();
  }
  private aggregateProject() {
    return {
      _id: 1,
      username: '$authId.username',
      uId: '$authId.uId',
      email: '$authId.email',
      avatarColor: '$authId.avatarColor',
      createdAt: '$authId.createdAt',
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1,
      authId: '$authId._id'
    };
  }
}

export const userService = new UserService();
