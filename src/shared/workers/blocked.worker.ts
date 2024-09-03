import { config } from '@root/config';
import { blockUserService } from '@services/db/block-user.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';


const logger: Logger = config.createLogger('blockUserWorker');

class BlockUserWorker {
  public async updateBlockedUserDataInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyOne, keyTwo, type } = job.data;
      if(type === 'unblock') {
        await blockUserService.unBlockUser(keyOne,  keyTwo);
      } else {
        await blockUserService.blockUser(keyOne, keyTwo);
      }
      job.progress(100);
      done(null, job.data);
    } catch(e) {
      logger.error(e);
      done(e as Error);
    }
  }
}

export const blockUserWorker: BlockUserWorker = new BlockUserWorker();
