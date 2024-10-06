import { ICommentDocument } from '@comments/interfaces/comments.interface';
import { model, Model, Schema } from 'mongoose';


const commentSchema: Schema = new Schema({
  postId:   { type: Schema.Types.ObjectId, ref: 'Post', index: true },
  avatarColor: { type: String, default: '' },
  userTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  comment: { type: String, default: '' },
  username: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  profilePicture: { type: String, default: '' }
});

const CommentModel: Model<ICommentDocument> = model<ICommentDocument>('Comment', commentSchema, 'Comment');

export { CommentModel };
