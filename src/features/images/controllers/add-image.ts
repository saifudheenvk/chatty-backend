import HTTP_STATUS from 'http-status-codes';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { addImageSchema } from '@image/schemes/images';
import { config } from '@root/config';
import { UserCache } from '@services/redis/user.cache';
import { socketIOImageObject } from '@sockets/image';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { IBgUploadResponse, IFileImageJobData } from '@image/interfaces/image.interface';
import { imageQueue } from '@services/queues/image.queue';
import { Helper } from '@global/helpers/helper';




const userCache: UserCache = new UserCache();

export class Add {

  @JoiValidation(addImageSchema)
  public async addProfileImage(req: Request, res: Response): Promise<void> {
    const { image } = req.body;
    const result: UploadApiResponse = (await uploads(image, `${req.currentUser!.userId}`, true, true)) as UploadApiResponse;
    if (!result.public_id) {
      throw new BadRequestError('FileUpload: Failed to upload file, Please try again');
    }
    const profilePicture: string = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;
    const cachedUser: IUserDocument = await userCache.updateSingleUserFromcache(`${req.currentUser!.userId}`, 'profilePicture',  profilePicture ) as IUserDocument;
    socketIOImageObject.emit('update user', cachedUser);
    const imageJobData: IFileImageJobData = {
      key: `${req.currentUser!.userId}`,
      imgId: result.public_id,
      imgVersion: result.version.toString(),
      value: profilePicture
    };
    imageQueue.addImageJob('addProfileImageToDB', imageJobData);
    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  @JoiValidation(addImageSchema)
  public async addBackgroundImage(req: Request, res: Response): Promise<void> {
    const { image } = req.body;
    const result: IBgUploadResponse = await Add.prototype.uploadBackgroundImage(image) as IBgUploadResponse;
    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserFromcache(`${req.currentUser!.userId}`, 'bgImageId', result.publicId);
    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserFromcache(`${req.currentUser!.userId}`, 'bgImageVersion', result.version);
    await Promise.all([bgImageId, bgImageVersion]);
    const bgImageJobData: IFileImageJobData = {
      key: `${req.currentUser!.userId}`,
      imgId: result.publicId,
      imgVersion: result.version
    };
    imageQueue.addImageJob('addBackgroundImageToDB', bgImageJobData);
    const response: [IUserDocument, IUserDocument] = (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];
    socketIOImageObject.emit('update user', {
      bgImageId: result.publicId,
      bgImageVersion: result.version,
      userId: response[0]
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  private async uploadBackgroundImage(image: string): Promise<IBgUploadResponse> {
    let version: string = '';
    let publicId: string = '';

    if(Helper.isDataURL(image)) {
      const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
      if (!result.public_id) {
        throw new BadRequestError('FileUpload: Failed to upload file, Please try again');
      }
      version = result.version.toString();
      publicId = result.public_id;
    } else {
      const value = image.split('/');
      version = value[value.length - 2];
      publicId = value[value.length - 1];
    }
    return { version: version.replace(/v/g, ''), publicId };
  }
}
