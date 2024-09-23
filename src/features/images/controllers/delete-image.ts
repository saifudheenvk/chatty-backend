import HTTP_STATUS from 'http-status-codes';
import { socketIOImageObject } from '@sockets/image';
import { Request, Response } from 'express';
import { IFileImageDocument, IFileImageJobData } from '@image/interfaces/image.interface';
import { imageQueue } from '@services/queues/image.queue';
import { imageService } from '@services/db/image.service';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';


const userCache: UserCache = new UserCache();
export class Delete {

  public async deleteImage(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;

    socketIOImageObject.emit('delete image', imageId);
    const imageJobData: IFileImageJobData = {
      imageId
    };
    imageQueue.addImageJob('removeImageFromDB', imageJobData);
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }

  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const image: IFileImageDocument = await imageService.getBackgroundImageById(req.params.bgImageId);
    socketIOImageObject.emit('delete image', image?._id);
    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserFromcache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      ''
    ) as Promise<IUserDocument>;
    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserFromcache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      ''
    ) as Promise<IUserDocument>;
    (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];
    imageQueue.addImageJob('removeImageFromDB', {
      imageId: image?._id as string
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }
}
