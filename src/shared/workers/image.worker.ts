import { config } from '@root/config';
import { imageService } from '@services/db/image.service';
import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';



const logger: Logger = config.createLogger('imageWorker');
class ImageWorker {
  async addUserProfileImageToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, imgId, imgVersion, value  } = job.data;
      await imageService.addUserProfileImageToDB(key, value, imgId, imgVersion);
      job.progress(100);
      done(null, job.data); 
    } catch (error) { 
      logger.error(error);
      done(error as Error);
    }
  }

  async updateBackgroundImageToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, imgId, imgVersion  } = job.data;
      await imageService.addBackgroundImageToDB(key, imgId, imgVersion);
      job.progress(100);
      done(null, job.data); 
    } catch (error) { 
      logger.error(error);
      done(error as Error);
    }
  }

  async addImageToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, imgId, imgVersion  } = job.data;
      await imageService.addImage(key, imgId, imgVersion, '');
      job.progress(100);
      done(null, job.data); 
    } catch (error) { 
      logger.error(error);
      done(error as Error);
    }
  }

  async removeImageFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { imgId } = job.data;
      await imageService.deleteImageFromDB(imgId);
      job.progress(100);
      done(null, job.data); 
    } catch (error) { 
      logger.error(error);
      done(error as Error);
    }
  }
}

export const imageWorker: ImageWorker = new ImageWorker();
