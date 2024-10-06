import { authUserPayload } from '@mocks/auth.mock';
import { newPost, postMockRequest, postMockResponse } from '@mocks/post.mock';
import { Request, Response } from 'express';
import * as postServer from '@sockets/post';
import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { Delete } from '@post/controllers/delete-post';
import { Server } from 'socket.io';



jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/post.cache');

Object.defineProperties(postServer, {
  socketIOPostObject: {
    value: new Server(),
    writable: true
  }
});

describe('Delete Post', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Should send correct json response', async () => {
    const req: Request = postMockRequest(newPost, authUserPayload, { postId: '12345' }) as Request;
    const res: Response = postMockResponse();

    jest.spyOn(postServer.socketIOPostObject, 'emit');
    jest.spyOn(PostCache.prototype, 'deletePost');
    jest.spyOn(postQueue, 'addPostJob');

    await Delete.prototype.delete(req, res);
    expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('delete post', req.params.postId);
    expect(PostCache.prototype.deletePost).toHaveBeenCalledWith(req.params.postId, `${req.currentUser?.userId}`);
    expect(postQueue.addPostJob).toHaveBeenCalledWith('deletePostFromDB', {keyOne: req.currentUser?.userId, keyTwo: req.params.postId});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Post deleted successfully'
    });
  });
});
