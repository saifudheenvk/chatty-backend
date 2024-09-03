import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export interface IReactionDocument extends Document {
  _id?: string | ObjectId;
  username: string;
  avatarColor: string;
  type: string;
  postId: string;
  profilePicture: string;
  createdAt?: Date;
  userTo?: string | ObjectId; //id of user who created the post
  comment?: string;
}

export interface IReactions {
  like: number;
  love: number;
  happy: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface IReactionJob {
  postId: string;
  username: string;
  previousReaction: string;
  userTo?: string;
  userFrom?: string;
  type?: string;
  reactionObject?: IReactionDocument;
}

export interface IQueryReaction {
  _id?: string | ObjectId;
  postId?: string | ObjectId;
}

export interface IReaction {
  senderName: string;
  type: string;
}