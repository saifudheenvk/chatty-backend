import HTTP_STATUS from 'http-status-codes';
import { Helper } from '@global/helpers/helper';
import { userService } from '@services/db/user.service';
import { ISearchUser } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';

export class Search {

  public async user(req: Request, res: Response): Promise<void> {
    const regex = new RegExp(Helper.escapeRegex(req.params.query), 'i');
    const users: ISearchUser[] = await userService.searchUsers(regex);
    res.status(HTTP_STATUS.OK).json({ message: 'Search results', search: users });
  }
}
