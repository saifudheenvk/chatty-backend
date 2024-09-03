import { IFollowerDocument } from '@follower/interfaces/follower.interface';
import { model, Model, Schema } from 'mongoose';



const followerSchema: Schema = new Schema({
  followeeId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  followerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  createdAt: { type: Date, default: Date.now }
});


export const FollowerModel: Model<IFollowerDocument> = model<IFollowerDocument>('Follower', followerSchema, 'Follower');
