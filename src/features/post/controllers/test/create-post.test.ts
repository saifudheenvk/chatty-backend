import { authUserPayload } from '@mocks/auth.mock';
import { newPost, postMockRequest, postMockResponse } from '@mocks/post.mock';
import { Request, Response } from 'express';
import * as postServer from '@sockets/post';
import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { Create } from '@post/controllers/create-post';
import { Server } from 'socket.io';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/post.cache');
jest.mock('@global/helpers/cloudinary-upload');


Object.defineProperties(postServer, {
  socketIOPostObject: {
    value: new Server(),
    writable: true
  }
});


describe('Create Post', ()=> {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Should send correct json response', async ()=> {
    const req: Request = postMockRequest(newPost, authUserPayload) as Request;
    const res: Response = postMockResponse();

    jest.spyOn(postServer.socketIOPostObject, 'emit');
    const spy = jest.spyOn(PostCache.prototype, 'saveToCache');
    jest.spyOn(postQueue, 'addPostJob');

    await Create.prototype.post(req, res);
    const createdPost = spy.mock.calls[0][0].createdPost;
    expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('add post', createdPost);
      expect(PostCache.prototype.saveToCache).toHaveBeenCalledWith({
        key: spy.mock.calls[0][0].key,
        currentUserId: `${req.currentUser?.userId}`,
        uId: `${req.currentUser?.uId}`,
        createdPost
      });
      expect(postQueue.addPostJob).toHaveBeenCalledWith('addPostToDB', { key: req.currentUser?.userId, value: createdPost });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post created successfully'
      });
  });

});
