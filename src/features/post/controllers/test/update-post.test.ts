import { Server } from 'socket.io';
import * as postServer from '@sockets/post';
import { postMockData, postMockRequest, postMockResponse, updatedPost, updatedPostWithImage } from '@mocks/post.mock';
import { Request, Response } from 'express';
import { PostCache } from '@services/redis/post.cache';
import { Update } from '@post/controllers/update-post';
import { postQueue } from '@services/queues/post.queue';
import { authUserPayload } from '@mocks/auth.mock';



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


describe('Update Post', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('posts', () => {
    it('should send correct json response', async () => {
      const req: Request = postMockRequest(updatedPost, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePost').mockResolvedValue(postMockData);
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await Update.prototype.update(req, res);
      expect(postSpy).toHaveBeenCalledWith(`${postMockData._id}`, updatedPost);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post updated successfully'
      });
    });
  });

  describe('postWithImage', () => {
    it('should send correct json response if imgId and imgVersion exists', async () => {
      updatedPostWithImage.imgId = '1234';
      updatedPostWithImage.imgVersion = '1234';
      updatedPost.imgId = '1234';
      updatedPost.imgVersion = '1234';
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      const req: Request = postMockRequest(updatedPostWithImage, authUserPayload, { postId: `${postMockData._id}` }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePost').mockImplementationOnce(() => Promise.resolve(postMockData));
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await Update.prototype.postWithImage(req, res);
      expect(PostCache.prototype.updatePost).toHaveBeenCalledWith(`${postMockData._id}`, postSpy.mock.calls[0][1]);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post with image updated successfully'
      });
    });


  });

});
