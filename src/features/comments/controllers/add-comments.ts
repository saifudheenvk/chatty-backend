import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { ICommentDocument, ICommentJob } from '@comments/interfaces/comments.interface';
import { addCommentSchema } from '@comments/schemes/comments';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { Request, Response } from 'express';
import { CommentCache } from '@services/redis/comment.cache';
import { commentQueue } from '@services/queues/comment.queue';


const commentCache: CommentCache = new CommentCache();
export class Add {

  @JoiValidation(addCommentSchema)
  public async add(req: Request, res: Response): Promise<void> {
    const { userTo, postId, comment, profilePicture } = req.body;
    const commentObjectId = new ObjectId();
    const commentData: ICommentDocument = {
      _id: commentObjectId,
      comment,
      username: req.currentUser!.username,
      postId,
      userTo,
      profilePicture,
      avatarColor: req.currentUser!.avatarColor,
      createdAt: new Date()
    } as ICommentDocument;
    await commentCache.savePostCommentToCache(postId, JSON.stringify(commentData));
    
    const databaseData: ICommentJob = {
      postId,
      username: req.currentUser!.username,
      userTo,
      userFrom: req.currentUser!.userId,
      comment: commentData
    };
    commentQueue.addCommentJob('addCommentToDB', databaseData);

    res.status(HTTP_STATUS.OK).json({ message: 'Comment added successfully' });
  }
    
}
