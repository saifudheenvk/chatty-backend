import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { BaseQueue } from './base.queue';
import { reactionWorker } from '@workers/reactions.worker';



class ReactionQueue extends BaseQueue {
  constructor() {
    super('Reaction');
    this.processJob('addReactionToDB', 5, reactionWorker.addReactionToDB);
    this.processJob('removeReactionFromDB', 5, reactionWorker.removeReactionFromDB);
  }

  public addPostReaction(name: string, data: IReactionJob) {
    this.addQueue(name, data);
  }
}

export const reactionQueue: ReactionQueue = new ReactionQueue();
