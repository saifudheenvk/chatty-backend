import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { BadRequestError } from '@global/helpers/error-handler';
import { changePasswordSchema } from '@user/schemes/info';
import { authService } from '@services/db/auth.service';
import { Request, Response } from 'express';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { userService } from '@services/db/user.service';
import publicIP from 'ip';
import moment from 'moment';
import { resetPasswordTemplate } from '@services/emails/templates/reset-password/reset-password-template';
import { emailQueue } from '@services/queues/email.queue';
import HTTP_STATUS from 'http-status-codes';


export class Update {
  @JoiValidation(changePasswordSchema)
  public async password(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if(newPassword !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }
    const existingUser: IAuthDocument = await authService.getAuthUserByUserName(`${req.currentUser!.username}`);
    const passwordsMatch: boolean = await existingUser.comparePassword(currentPassword);
    if(!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }
    const hashedPassword: string = await existingUser.hashPassword(newPassword);
    await userService.updatePassword(existingUser.username, hashedPassword);

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    };
    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob('changePasswordEmail', { template, receiverEmail: existingUser.email!, subject: 'Password Update Confirmation' });
    res.status(HTTP_STATUS.OK).json({
      message: 'Password updated successfully. You will be redirected shortly to the login page.'
    });
  }
}
