import { UserModel } from '@user/models/user.schema';
import mongoose, { Document } from 'mongoose';
import { PushOperator } from 'mongodb';



class BlockUserService {

  public async blockUser(userId: string, blockedUser: string): Promise<void> {
    await UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId, blocked: { $ne: new mongoose.Types.ObjectId(blockedUser) } }, // you can also use $nin in place of $ne
          update: { $push: { blocked: new mongoose.Types.ObjectId(blockedUser) } as PushOperator<Document> }
        }
      },
      {
        updateOne: {
          filter: { _id: blockedUser, blockedBy: { $ne: new mongoose.Types.ObjectId(userId) } },
          update: { $push: { blockedBy: new mongoose.Types.ObjectId(userId) } as PushOperator<Document> }
        }
      }
    ]);
  }


  public async unBlockUser(userId: string, blockedUser: string): Promise<void> {
    await UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $pull: { blocked: new mongoose.Types.ObjectId(blockedUser) } as PushOperator<Document> }
        }
      },
      {
        updateOne: {
          filter: { _id: blockedUser },
          update: { $pull: { blockedBy: new mongoose.Types.ObjectId(userId) } as PushOperator<Document> }
        }
      }
    ]);
  }
}

export const blockUserService: BlockUserService = new BlockUserService();
