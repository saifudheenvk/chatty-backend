import { ObjectId } from 'mongodb';
import { IUserDocument } from '@user/interfaces/user.interface';
import mongoose, { Document } from 'mongoose';


export interface IFollowers {
  userId: string;
}

export interface IFollowerDocument extends Document {
  _id: string;
  followerId: string;
  followeeId: string;
  createdAt: Date;
}

export interface IFollowerData {
  _id?: mongoose.Types.ObjectId;
  avatarColor: string;
  username: string;
  profilePicture: string;
  followersCount: number;
  followingCount: number;
  userProfile?: IUserDocument;
  uId: string;
}

export interface IFollower {
  _id: mongoose.Types.ObjectId | string;
  followerId?: IFollowerData;
  followeeId?: IFollowerData;
  createdAt?: Date;
}

export interface IFollowerJobData {
  keyOne?: string;
  keyTwo?: string;
  username?: string;
  followerDocumentId?: ObjectId;
}

export interface IBlockedUserJobData {
  keyOne?: string;
  keyTwo?: string;
  type?: string;
}
