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

  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }
}

export const authService = new AuthService();
