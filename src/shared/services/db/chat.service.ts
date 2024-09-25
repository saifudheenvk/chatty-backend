import { IMessageData } from '@chat/interfaces/chat.interface';
import { IConversationDocument } from '@chat/interfaces/conversation.interface';
import { MessageModel } from '@chat/models/chat.schema';
import { ConversationModel } from '@chat/models/conversation.schema';
import { ObjectId } from 'mongodb';




class ChatService {

  public async addMessageToDB(data: IMessageData): Promise<void> {
    const conversation: IConversationDocument[] = await ConversationModel.find({ _id: data.conversationId });
    if(!conversation.length) {
      await ConversationModel.create({ _id: data.conversationId, senderId: data.senderId, receiverId: data.receiverId });
    }

    await MessageModel.create({
      _id: data._id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      senderUsername: data.senderUsername,
      senderAvatarColor: data.senderAvatarColor,
      senderProfilePicture: data.senderProfilePicture,
      receiverUsername: data.receiverUsername,
      receiverAvatarColor: data.receiverAvatarColor,
      receiverProfilePicture: data.receiverProfilePicture,
      body: data.body,
      gifUrl: data.gifUrl,
      isRead: data.isRead,
      selectedImage: data.selectedImage,
      reaction: data.reaction,
      createdAt: data.createdAt,
      deleteForMe: data.deleteForMe,
    });
  }

  public async getUserConversationList(userId: ObjectId): Promise<IMessageData[]> {
    const conversationList: IMessageData[] = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $group: { _id: '$conversationId', result: { $last: '$$ROOT' } } }, 
      { $project: {
        _id: '$result._id',
        conversationId: '$result.conversationId',
        senderId: '$result.senderId',
        receiverId: '$result.receiverId',
        receiverUsername: '$result.receiverUsername',
        receiverAvatarColor: '$result.receiverAvatarColor',
        receiverProfilePicture: '$result.receiverProfilePicture',
        senderUsername: '$result.senderUsername',
        senderAvatarColor: '$result.senderAvatarColor',
        senderProfilePicture: '$result.senderProfilePicture',
        body: '$result.body',
        isRead: '$result.isRead',
        gitUrl: '$result.gitUrl',
        selectedImage: '$result.selectedImage',
        reaction: '$result.reaction',
        createdAt: '$result.createdAt',
        deleteForMe: '$result.deleteForMe',
        deleteForEveryone: '$result.deleteForEveryone'
      } },
      { $sort: { createdAt: 1 } }
    ]);
    return conversationList;
  }

  public async getMessages(senderId: ObjectId, receiverId: ObjectId): Promise<IMessageData[]> {
    const messages: IMessageData[] = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: senderId, receiverId: receiverId }, { senderId: receiverId, receiverId: senderId }] } }, // messages send by sender or reciever
      { $sort: { createdAt: 1 } }
    ]);
    return messages;
  }

  public async markMessagesAsReadInDB(senderId: ObjectId, receiverId: ObjectId ): Promise<void> {
    await MessageModel.updateMany({ $or: [{ senderId: senderId, receiverId: receiverId, isRead: false }, { senderId: receiverId, receiverId: senderId, isRead: false }] }, { isRead: true });
  }

  public async markMessageAsDeletedInDB(messageId: ObjectId, type: string): Promise<void> {
    if(type === 'deleteForMe') {
      await MessageModel.updateOne({ _id: messageId }, { $set: { deleteForMe: true } }).exec();
    } else {
      await MessageModel.updateOne({ _id: messageId }, { $set: { deleteForEveryone: true, deleteForMe: true } }).exec();
    }
  }

  public async updateMessageReaction(messageId: ObjectId, senderName: string, reaction: string, type: 'add' | 'remove'): Promise<void> {
    if(type === 'add') {
      await MessageModel.updateOne({ _id: messageId }, { $push: { reaction: { senderName, type: reaction } } }).exec();
    } else {
      await MessageModel.updateOne({ _id: messageId }, { $pull: { reaction: { senderName } } }).exec();
    }
  }
}

const chatService: ChatService = new ChatService();
export { chatService };
