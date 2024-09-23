import { ObjectId } from 'mongodb';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { Request, Response } from 'express';
import { addChatSchema } from '@chat/schemes/chat';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { uploads } from '@global/helpers/cloudinary-upload';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '@global/helpers/error-handler';
import HTTP_STATUS from 'http-status-codes';
import { IMessageData, IMessageNotification } from '@chat/interfaces/chat.interface';
import { socketIOChatObject } from '@sockets/chat';
import { INotificationTemplate } from '@notification/interfaces/notifications.interface';
import { notificationTemplate } from '@services/emails/templates/notifications/notification-template';
import { emailQueue } from '@services/queues/email.queue';
import { config } from '@root/config';
import { ChatCache } from '@services/redis/chat.cache';



const userCache: UserCache = new UserCache();
const chatChache: ChatCache = new ChatCache();

export class Add {
  @JoiValidation(addChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    const { conversationId, receiverId, receiverUsername, receiverAvatarColor, receiverProfilePicture, body, gifUrl, selectedImage, isRead } = req.body;
    const messageObjectId: ObjectId = new ObjectId();
    const conversationObjectId: ObjectId = !conversationId ? new ObjectId() : ObjectId.createFromHexString(conversationId);
    const sender: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;
    let fileUrl = '';
    if(selectedImage.length) {
      const result: UploadApiResponse = (await uploads(req.body.image, `${req.currentUser!.userId}`, true, true)) as UploadApiResponse;
      if (!result.public_id) {
        throw new BadRequestError('FileUpload: Failed to upload file, Please try again');
      }
      fileUrl = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;
    }
    
    const messageData: IMessageData = {
      _id: messageObjectId,
      conversationId: conversationObjectId,
      receiverId,
      senderUsername: `${req.currentUser!.username}`,
      senderId: `${req.currentUser!.userId}`,
      senderAvatarColor: `${req.currentUser!.avatarColor}`,
      senderProfilePicture: `${sender.profilePicture}`,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      selectedImage: fileUrl,
      isRead,  // if sender and reciever is in the same page then it will be true
      reaction: [],
      createdAt: new Date(),
      deleteForMe: false,
      deleteForEveryone: false
    };
    Add.prototype.emitSocketIOEvent(messageData);

    if(!isRead) {
      Add.prototype.messageNotification({ currentUser: req.currentUser!, message: body, receiverName: receiverUsername, receiverId, messageData });
    }

    await chatChache.addChatListToCache(`${req.currentUser!.userId}`, `${receiverId}`, `${conversationObjectId}`);
    await chatChache.addChatListToCache(`${receiverId}`, `${req.currentUser!.userId}`, `${conversationObjectId}`);
    await chatChache.addChatMessageToCache(`${conversationObjectId}`, messageData);
    // chatQueue.addChatJob('addChatMessageToDB', messageData);


    res.status(HTTP_STATUS.OK).json({ message: 'Message added', conversationId: conversationObjectId });
  }

  public async addChatUsers(req: Request, res: Response): Promise<void> {
    // const chatUsers = await messageCache.addChatUsersToCache(req.body);
    // socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users added' });
  }

  public async removeChatUsers(req: Request, res: Response): Promise<void> {
    // const chatUsers = await messageCache.removeChatUsersFromCache(req.body);
    // socketIOChatObject.emit('add chat users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users removed' });
  }

  private emitSocketIOEvent(data: IMessageData): void {
    socketIOChatObject.emit('message received', data); //this is using to update the chat page in client
    socketIOChatObject.emit('chat list', data); //this is using to update the chat list in client
  }

  private async messageNotification(data: IMessageNotification): Promise<void> {
    const user: IUserDocument = (await userCache.getUserFromCache(`${data.receiverId}`)) as IUserDocument;
    const templateParams: INotificationTemplate = {
      username: data.receiverName,
      header: `Message notification from ${data.currentUser.username}`,
      message: data.message
    };
    const template: string = notificationTemplate.notificationMessageTemplate(templateParams);

    emailQueue.addEmailJob('directMessageEmail', {
      receiverEmail: user.email!,
      template,
      subject: `You've received messages from ${data.currentUser.username}`
    });
  }
}
