import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { signupSchema } from '@auth/schemes/signup';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { authService } from '@services/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helper } from '@global/helpers/helper';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserCache } from '@services/redis/user.cache';
import { config } from '@root/config';
import { omit } from 'lodash';
import { authQueue } from '@services/queues/auth.queue';
import { userQueue } from '@services/queues/user.queue';
import JWT from 'jsonwebtoken';

const userCache: UserCache = new UserCache();

export class SignUp {
  @JoiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, password, avatarColor, avatarImage, email } = req.body;
    const existingUser = await authService.getAuthUserByUserNameOrEmail(email, username);
    if (existingUser) {
      throw new BadRequestError('Email or Username is already taken');
    }

    const authObjectId = new ObjectId();
    const userObjectId = new ObjectId();
    const uId = `${Helper.generateRandomIntegers(12)}`;
    const authData = SignUp.prototype.signUpData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor
    });
    const result: UploadApiResponse = (await uploads(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;
    if (!result.public_id) {
      throw new BadRequestError('FileUpload: Failed to upload file, Please try again');
    }

    //add data to redis
    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);
    userDataForCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveToCache(`${userObjectId}`, uId, userDataForCache);

    //save data to db
    omit(userDataForCache, ['username', 'email', 'uId', 'avatarColor', 'password']);
    authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });
    userQueue.addUserJob('addUserToDB', { value: userDataForCache });

    //jwt token
    const jwtToken = SignUp.prototype.signUpToken(authData, userObjectId);
    req.session = { jwt: jwtToken };

    res.status(HTTP_STATUS.CREATED).json({ message: 'User Successfully created', user: userDataForCache, token: jwtToken });
  }

  private signUpData(data: ISignUpData): IAuthDocument {
    return {
      _id: data._id,
      uId: data.uId,
      email: data.email.toLowerCase(),
      username: Helper.convertFirstLetterUppercase(data.username),
      password: data.password,
      createdAt: new Date(),
      avatarColor: data.avatarColor
    } as IAuthDocument;
  }

  private signUpToken(data: IAuthDocument, userObjectId: ObjectId) {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    );
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helper.convertFirstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }
}
