import mongoose from 'mongoose';


export interface IConversationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  recieverId: mongoose.Types.ObjectId;
}
