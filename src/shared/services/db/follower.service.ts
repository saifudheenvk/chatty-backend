import { IFollowerData, IFollowerDocument, IFollowerJobData } from '@follower/interfaces/follower.interface';
import { FollowerModel } from '@follower/models/follower.schema';
import { UserModel } from '@user/models/user.schema';
import mongoose, { Query } from 'mongoose';
import { BulkWriteResult } from 'mongodb';
import { IQueryComplete, IQueryDeleted } from '@post/interfaces/post.interface';




class FollowerService {
  public async addFollowerToDB(data: IFollowerJobData): Promise<void> {
    await FollowerModel.create({
      _id: data.followerDocumentId,
      followeeId: new mongoose.Types.ObjectId(data.keyOne),
      followerId: new mongoose.Types.ObjectId(data.keyTwo),
    });

    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: data.keyOne },
          update: { $inc: { followingCount: 1 } },
        }
      },
      {
        updateOne: {
          filter: { _id: data.keyTwo },
          update: { $inc: { followersCount: 1 } },
        }
      }
    ]);

    await Promise.all([users, UserModel.findOne({ _id: data.keyOne })]);
  }

  public async removeFollowerFromDB(followeeId: string, followerId: string): Promise<void> {
    const unfollow: Query<IQueryComplete & IQueryDeleted, IFollowerDocument> =  FollowerModel.deleteOne({
      followeeId: followeeId,
      followerId: followerId
    });
    const users: Promise<BulkWriteResult> = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: followeeId },
          update: { $inc: { followingCount: -1 } },
        }
      },
      {
        updateOne: {
          filter: { _id: followerId },
          update: { $inc: { followersCount: -1 } },
        }
      }
    ]);
    await Promise.all([users, unfollow]);
  }

  public async getFolloyeesFromDB(userId: string): Promise<IFollowerData[]> {
    const folloyees: IFollowerData[] = await FollowerModel.aggregate([
      { $match: {followeeId: new mongoose.Types.ObjectId(userId)} },
      { $lookup: { from: 'User', localField: 'followeeId', foreignField: '_id', as: 'followeeId'} },
      { $unwind: '$followeeId' },
      { $lookup: { from: 'Auth', localField: '$followeeId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followeeId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          profilePicture: '$authId.profilePicture',
          followersCount: '$followeeId.followersCount',
          followingCount: '$followeeId.followingCount',
          userProfile: '$followeeId'
        }
      },
      { $project: {
        _v: 0,
        authId: 0,
        followeeId: 0,
        followerId: 0
      }}
    ]) as IFollowerData[];
    return folloyees;
  }

  public async getFollowersFromDB(userId: string): Promise<IFollowerData[]> {
    const followers: IFollowerData[] = await FollowerModel.aggregate([
      { $match: { followeeId: new mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'User', localField: 'followerId', foreignField: '_id', as: 'followerId' } },
      { $unwind: '$followerId' },
      { $lookup: { from: 'Auth', localField: 'followerId.authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      {
        $addFields: {
          _id: '$followerId._id',
          username: '$authId.username',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          postCount: '$followerId.postsCount',
          followersCount: '$followerId.followersCount',
          followingCount: '$followerId.followingCount',
          profilePicture: '$followerId.profilePicture',
          userProfile: '$followerId'
        }
      },
      { $project: {
          followerId: 0,
          authId: 0,
          followeeId: 0,
          _v: 0
        } 
      }
    ]);

    return followers as IFollowerData[];
  }
}

export const followerService = new FollowerService();
