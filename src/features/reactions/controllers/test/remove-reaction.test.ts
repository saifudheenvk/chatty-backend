import { authUserPayload } from '@mocks/auth.mock';
import { reactionMockRequest, reactionMockResponse } from '@mocks/reaction.mock';
import { ReactionCache } from '@services/redis/reaction.cache';
import { Request, Response } from 'express';
import { Remove } from '@reaction/controllers/remove-reaction';
import { reactionQueue } from '@services/queues/reactions.queue';


jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/reaction.cache');

describe('Delete Reaction', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('It should send correct json response', async () => {
    const req: Request = reactionMockRequest({}, {}, authUserPayload, {
      postId: '6027f77087c9d9ccb1555268',
      previousReaction: 'like',
      postReactions: JSON.stringify({
        like: 1,
        love: 0,
        happy: 0,
        wow: 0,
        sad: 0,
        angry: 0
      })
    }) as Request;
    const res: Response = reactionMockResponse();

    jest.spyOn(ReactionCache.prototype, 'removePostReactionFromCache');
    const spy = jest.spyOn(reactionQueue, 'addPostReaction');

    await Remove.prototype.remove(req, res);
    expect(ReactionCache.prototype.removePostReactionFromCache).toHaveBeenCalledWith(
      '6027f77087c9d9ccb1555268',
      `${req.currentUser?.username}`,
      JSON.parse(req.params.postReactions)
    );
    expect(reactionQueue.addPostReaction).toHaveBeenCalledWith(spy.mock.calls[0][0], spy.mock.calls[0][1]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Reaction removed from post'
    });
  });
});
