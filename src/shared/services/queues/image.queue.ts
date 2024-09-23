import { IFileImageJobData } from '@image/interfaces/image.interface';
import { BaseQueue } from './base.queue';
import { imageWorker } from '@workers/image.worker';





class ImageQueue extends BaseQueue {
  constructor() {
    super('image');
    this.processJob('addProfileImageToDB', 5, imageWorker.addUserProfileImageToDB);
    this.processJob('updateBackgroundImageToDB', 5, imageWorker.updateBackgroundImageToDB);
    this.processJob('addImageToDB', 5, imageWorker.addImageToDB);
    this.processJob('removeImageFromDB', 5, imageWorker.removeImageFromDB);
  }
  public addImageJob(name: string, data: IFileImageJobData): void {
    this.addQueue(name, data);
  }
}

const imageQueue: ImageQueue = new ImageQueue();
export { imageQueue };
