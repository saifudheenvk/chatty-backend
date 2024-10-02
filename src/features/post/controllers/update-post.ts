import HTTP_STATUS from 'http-status-codes';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema, postWithImageSchema, postWithVideoSchema } from '@post/schemes/post.schemes';
import { Request, Response } from 'express';
import { socketIOPostObject } from '@sockets/post';
import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '@global/helpers/error-handler';
import { uploads, videoUpload } from '@global/helpers/cloudinary-upload';
import Logger from 'bunyan';
import { config } from '@root/config';


const postCache: PostCache = new PostCache();
const logger: Logger = config.createLogger('updatePost');

export class Update {

  @JoiValidation(postSchema)
  public async update(req: Request, res: Response): Promise<void>{
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion
    } as IPostDocument;
    const postUpdated: IPostDocument = await postCache.updatePost(postId, updatedPost);
    socketIOPostObject.emit('update post', postUpdated, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }

  @JoiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body;
    if (imgId && imgVersion) {
      Update.prototype.updatePost(req);
    } else {
      const result: UploadApiResponse = await Update.prototype.addImageToExistingPost(req);
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
  }

  @JoiValidation(postWithVideoSchema)
  public async postWithVideo(req: Request, res: Response): Promise<void> {
    const { videoId, videoVersion } = req.body;
    if (videoId && videoVersion) {
      Update.prototype.updatePost(req);
    } else {
      const result: UploadApiResponse = await Update.prototype.addImageToExistingPost(req);
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Post with video updated successfully' });
  }

  private async updatePost(req: Request): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId: imgId ? imgId : '',
      imgVersion: imgVersion ? imgVersion : '',
    } as IPostDocument;

    const postUpdated: IPostDocument = await postCache.updatePost(postId, updatedPost);
    socketIOPostObject.emit('update post', postUpdated, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
  }

  private async addImageToExistingPost(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image, video } = req.body;
    const { postId } = req.params;
    const result: UploadApiResponse = image
      ? ((await uploads(image)) as UploadApiResponse)
      : ((await videoUpload(video)) as UploadApiResponse);
    if (!result?.public_id) {
      return result;
    }
    logger.info(result);
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId: image ? result.public_id : '',
      imgVersion: image ? result.version.toString() : ''
    } as IPostDocument;

    const postUpdated: IPostDocument = await postCache.updatePost(postId, updatedPost);
    socketIOPostObject.emit('update post', updatedPost, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
    //call image queue to add to image mongo collection
    return result;
  }

  

}
