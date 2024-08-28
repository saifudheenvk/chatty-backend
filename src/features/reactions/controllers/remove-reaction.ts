import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ReactionCache } from '@services/redis/reaction.cache';
import { reactionQueue } from '@services/queues/reactions.queue';
import Logger from 'bunyan';
import { config } from '@root/config';

const reactionCache: ReactionCache = new ReactionCache();
const logger: Logger = config.createLogger('addReaction');

export class Remove {
  public async remove(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction, postReactions } = req.params;
    logger.info(req.params);
    await reactionCache.removePostReactionFromCache(postId, `${req.currentUser!.username}`, JSON.parse(postReactions));
    const databaseReactionData: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction
    };
    reactionQueue.addPostReaction('removeReactionFromDB', databaseReactionData);
    res.status(HTTP_STATUS.OK).json({ message: 'Reaction removed from post' });
  }
}
