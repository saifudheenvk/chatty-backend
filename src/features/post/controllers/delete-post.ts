import HTTP_STATUS from 'http-status-codes';
import { postQueue } from '@services/queues/post.queue';
import { PostCache } from '@services/redis/post.cache';
import { socketIOPostObject } from '@sockets/post';
import { Request, Response } from 'express';


const postCache = new PostCache();

export class Delete {
  public async delete(req:Request, res: Response): Promise<void> {
    const { postId } = req.params;
    socketIOPostObject.emit('delete post', postId);
    await postCache.deletePost(postId, req.currentUser!.userId);
    postQueue.addPostJob('deletePostFromDB', {keyOne: req.currentUser!.userId, keyTwo: postId});
    res.status(HTTP_STATUS.OK).json({ message: 'Post deleted successfully' });
  }
}
