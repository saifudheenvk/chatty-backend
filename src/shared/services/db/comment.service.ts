/* eslint-disable @typescript-eslint/no-unused-vars */
import { ICommentDocument, ICommentJob, ICommentNameList, IQueryComment } from '@comments/interfaces/comments.interface';
import { CommentModel } from '@comments/models/comments.schema';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Query } from 'mongoose';



const userCache: UserCache = new UserCache();
class CommentService {
  public async saveCommentToDB(data: ICommentJob): Promise<void> {
    const { postId, userTo, userFrom, username, comment } = data;
    const newComment: Promise<ICommentDocument> =  CommentModel.create(comment);
    const post: Query<IPostDocument, IPostDocument> = PostModel.findOneAndUpdate({_id: postId}, {
      $inc: {
        commentsCount: 1
      }
    }, {
      new: true
    }) as Query<IPostDocument, IPostDocument>;
    const user: Promise<IUserDocument> = userCache.getUserFromCache(`${userTo}`) as Promise<IUserDocument>;
    const response: [ICommentDocument, IPostDocument, IUserDocument] = await Promise.all([newComment, post, user]);
  }

  public async getCommentsFromDB(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]> {
    const comments: ICommentDocument[] = await CommentModel.aggregate([{$match: query}, {$sort: sort}]);
    return comments;
  }

  public async getPostCommentNamesFromDB(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentNameList[]> {
    const commentsNamesList: ICommentNameList[] = await CommentModel.aggregate([{ $match: query }, { $sort: sort }, { $group: {_id: null, names: { $addToSet: '$username' }, count: { $sum: 1 }} }, { $project: { _id: 0 }}]);
    return commentsNamesList;
  }
}

export const commentService: CommentService = new CommentService();
