import { IReactionDocument } from '@reaction/interfaces/reaction.interface';
import mongoose, { model, Model, Schema } from 'mongoose';



const reactionScema: Schema = new Schema({
  username: { type: String, default: '' },
  avatarColor: { type: String, default: ''  },
  profilePicture: { type: String, default: ''  },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true },
  type: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});


const ReactionModel: Model<IReactionDocument> = model<IReactionDocument>('Reaction', reactionScema, 'Reaction');


export { ReactionModel };
