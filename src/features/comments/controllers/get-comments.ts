import { ICommentDocument, ICommentNameList } from '@comments/interfaces/comments.interface';
import { config } from '@root/config';
import { commentService } from '@services/db/comment.service';
import { CommentCache } from '@services/redis/comment.cache';
import Logger from 'bunyan';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';


const commentCache: CommentCache = new CommentCache();
const logger: Logger = config.createLogger('getComments');
export class Get {
  public async comments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedComments: ICommentDocument[] = await commentCache.getCommentsFromCache(postId);
    const comments: ICommentDocument[] = cachedComments.length ? cachedComments : await commentService.getCommentsFromDB({postId: new mongoose.Types.ObjectId(postId)}, { createdAt: -1 });
    logger.info(comments);
    res.status(HTTP_STATUS.OK).json({ message: 'All post comments', comments });
  }

  public async singleComment(req: Request, res: Response): Promise<void> {
    const { postId, commentId } = req.params;
    const cachedComment: ICommentDocument[] = await commentCache.getSingleCommentFromCache(postId, commentId);
    const comment: ICommentDocument[] = cachedComment.length ? cachedComment : await commentService.getCommentsFromDB({postId: new mongoose.Types.ObjectId(postId), _id: new mongoose.Types.ObjectId(commentId)}, { createdAt: -1 });
    logger.info(comment);
    res.status(HTTP_STATUS.OK).json({ message: 'Single post comment', comment: comment.length ? comment[0] : [] });
  }

  public async getCommentNames(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedCommentNames: ICommentNameList[] = await commentCache.getCommentNamesAndCountFromCache(postId);
    const commentNames: ICommentNameList[] = cachedCommentNames.length ? cachedCommentNames : await commentService.getPostCommentNamesFromDB({postId: new mongoose.Types.ObjectId(postId)}, { createdAt: -1 });
    logger.info(cachedCommentNames);
    res.status(HTTP_STATUS.OK).json({ message: 'All post comments names', comments: commentNames.length ? commentNames[0] : [] });
  }
}
