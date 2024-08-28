import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { addReactionSchema } from '@reaction/schemes/reactions';
import { Request, Response } from 'express';
import { ReactionCache } from '@services/redis/reaction.cache';
import { reactionQueue } from '@services/queues/reactions.queue';
import Logger from 'bunyan';
import { config } from '@root/config';


const reactionCache = new ReactionCache();
const logger: Logger = config.createLogger('addReaction');

export class Add {
  @JoiValidation(addReactionSchema)
  public async add(req: Request, res: Response): Promise<void> {
    const { userTo, postId, profilePicture, type, previousReaction, postReactions } = req.body;
    logger.info(req.body);
    const reactionDocument: IReactionDocument = {
      _id: new ObjectId(),
      postId,
      avatarColor: req.currentUser!.avatarColor,
      username: req.currentUser!.username,
      type,
      profilePicture
    } as IReactionDocument;
    await reactionCache.saveReactionsToCache(postId, type, reactionDocument, postReactions, previousReaction);

    const dataToSaveInDB: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      userTo,
      userFrom: req.currentUser!.userId,
      type,
      previousReaction,
      reactionObject: reactionDocument
    };
    reactionQueue.addPostReaction('addReactionToDB', dataToSaveInDB);
    res.status(HTTP_STATUS.OK).json({ message: 'Reaction added successfully' });
  }
}
