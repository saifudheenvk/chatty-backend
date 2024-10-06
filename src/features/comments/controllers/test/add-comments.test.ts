import { authUserPayload } from '@mocks/auth.mock';
import { reactionMockRequest, reactionMockResponse } from '@mocks/reaction.mock';
import { existingUser } from '@mocks/user.mock';
import { commentQueue } from '@services/queues/comment.queue';
import { CommentCache } from '@services/redis/comment.cache';
import { Request, Response } from 'express';
import { Add } from '@comments/controllers/add-comments';



jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/comment.cache');

describe('Add comments', () => {

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });


  it('should call savePostCommentToCache and addCommentJob methods', async () => {
    const req: Request = reactionMockRequest({}, {
      postId: '6027f77087c9d9ccb1555268',
      comment: 'This is a comment',
      profilePicture: 'https://place-hold.it/500x500',
      userTo: `${existingUser._id}`
    }, authUserPayload) as Request;
    const res: Response = reactionMockResponse();

    jest.spyOn(CommentCache.prototype, 'savePostCommentToCache');
    jest.spyOn(commentQueue, 'addCommentJob');

    await Add.prototype.add(req, res);
    expect(CommentCache.prototype.savePostCommentToCache).toHaveBeenCalled();
    expect(commentQueue.addCommentJob).toHaveBeenCalled();
  });

  it('should send correct json response', async () => {
    const req: Request = reactionMockRequest(
      {},
      {
        postId: '6027f77087c9d9ccb1555268',
        comment: 'This is a comment',
        profilePicture: 'https://place-hold.it/500x500',
        userTo: `${existingUser._id}`
      },
      authUserPayload
    ) as Request;
    const res: Response = reactionMockResponse();

    await Add.prototype.add(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Comment added successfully'
    });
  });
});
