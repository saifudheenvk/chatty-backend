import HTTP_STATUS from 'http-status-codes';
import { userService } from '@services/db/user.service';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Response, Request } from 'express';
import Logger from 'bunyan';
import { config } from '@root/config';

const userCache: UserCache = new UserCache();
const logger: Logger = config.createLogger('currentUser');
export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let user = null;
    let token = null;

    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${req!.currentUser?.userId}`)) as IUserDocument;
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser!.userId}`);
    logger.info(existingUser);
    if (Object.keys(existingUser).length) {
      user = existingUser;
      token = req.session?.jwt;
      isUser = true;
    }
    res.status(HTTP_STATUS.OK).json({ user, token, isUser });
  }
}
