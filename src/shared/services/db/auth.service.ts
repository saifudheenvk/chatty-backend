import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.schema';
import { Helper } from '@global/helpers/helper';

class AuthService {
  public async getAuthUserByUserNameOrEmail(email: string, username: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: Helper.convertFirstLetterUppercase(username) }, { email: email.toLowerCase() }]
    };

    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByUserName(username: string): Promise<IAuthDocument> {
    const query = { username: Helper.convertFirstLetterUppercase(username) };

    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({ email: email.toLowerCase() }).exec()) as IAuthDocument;
    return user;
  }

  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }

  public async updatePasswordResetToken(token: string, authId: string, expiresIn: number): Promise<void> {
    await AuthModel.updateOne({ _id: authId}, {
      passwordResetToken: token,
      passwordResetExpires: expiresIn
    });
  }

  public async getAuthUserByPasswordToken(token: string): Promise<IAuthDocument> {
    return await  AuthModel.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: Date.now() }}).exec() as IAuthDocument;
  }
}

export const authService = new AuthService();
