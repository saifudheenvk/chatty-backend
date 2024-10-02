import HTTP_STATUS from 'http-status-codes';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { userQueue } from '@services/queues/user.queue';
import { UserCache } from '@services/redis/user.cache';
import { basicInfoSchema, socialLinksSchema } from '@user/schemes/info';
import { Request, Response } from 'express';



const userCache: UserCache = new UserCache();

export class Edit {
  @JoiValidation(basicInfoSchema) 
  public async info(req: Request, res: Response) { 
    for(const [key, value] of Object.entries(req.body)) {
      await userCache.updateSingleUserFromcache(req.currentUser!.userId, key, `${value}`);
    }
    userQueue.addUserJob('updateBasicInfoInDB', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }

  @JoiValidation(socialLinksSchema) 
  public async social(req: Request, res: Response) { 
    await userCache.updateSingleUserFromcache(req.currentUser!.userId, 'social', req.body);
    userQueue.addUserJob('updateSocialLinksInDB', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }
}
