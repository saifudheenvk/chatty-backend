import { IGetPostsQuery, IPostDocument, IQueryComplete, IQueryDeleted } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import Logger from 'bunyan';
import { Query, UpdateQuery } from 'mongoose';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';


const logger:Logger = config.createLogger('postService');

class PostService {
  public async createPost(userId: string, createdPost: IPostDocument): Promise<void> {
    try {
      const post: Promise<IPostDocument> = PostModel.create(createdPost);
      const user: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: 1 } });
      await Promise.all([post, user]);
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPosts(query: IGetPostsQuery, skip = 0, limit = 0, sort: Record<string, 1 | -1>): Promise<IPostDocument[]> {
    try {
      logger.info('From DB');
      let postQuery = {};
      if (query?.imgId && query?.gifUrl) {
        postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] };
      } else {
        postQuery = query;
      }
      const posts: IPostDocument[] = await PostModel.aggregate([{ $match: postQuery }, { $sort: sort }, { $skip: skip }, { $limit: limit }]);
      return posts;
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async postsCount(): Promise<number> {
    try {
      const count: number = await PostModel.find().countDocuments();
      return count;
    } catch(e) {
      logger.error(e);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const deletePost: Query<IQueryComplete & IQueryDeleted, IPostDocument> = PostModel.deleteOne({ _id: postId});
      const decrementPOstCount: UpdateQuery<IUserDocument> = UserModel.updateOne({_id: userId}, { $inc: { postsCount: -1 }});
      Promise.all([deletePost, decrementPOstCount]);
    } catch(e) {
      logger.error(e);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updatePost(postId: string, updatedPost: IPostDocument): Promise<void> {
    try {
      const post: UpdateQuery<IPostDocument> = PostModel.updateOne({_id: postId}, { $set: updatedPost });
      await Promise.all([post]);
    } catch (error) {
      logger.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}

export const postService = new PostService();
