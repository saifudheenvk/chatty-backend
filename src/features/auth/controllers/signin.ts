import HTTP_STATUS from 'http-status-codes';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { loginSchema } from '@auth/schemes/signin';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { BadRequestError } from '@global/helpers/error-handler';
import { config } from '@root/config';
import { authService } from '@services/db/auth.service';
import { userService } from '@services/db/user.service';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import JWT from 'jsonwebtoken';

export class SignIn {
  @JoiValidation(loginSchema)
  public async signin(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    const existingUser: IAuthDocument = await authService.getAuthUserByUserName(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);

    const jwtToken: string = JWT.sign(
      {
        userId: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );
    req.session = { jwt: jwtToken };
    res.status(HTTP_STATUS.OK).json({ message: 'User Successfully LoggedIn', user: user, token: jwtToken });
  }
}
