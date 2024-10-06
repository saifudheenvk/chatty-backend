import HTTP_STATUS from 'http-status-codes';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import { JoiValidation } from '@global/decorators/joi-validation.decorators';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@services/db/auth.service';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '@root/config';
import { emailQueue } from '@services/queues/email.queue';
import { forgotPasswordTemplate } from '@services/emails/templates/forgot-password/forgot-password-template';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import publicIP from 'ip';
import moment from 'moment';
import { resetPasswordTemplate } from '@services/emails/templates/reset-password/reset-password-template';
import Logger from 'bunyan';


const logger: Logger = config.createLogger('password');
export class Password {

  @JoiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    logger.info('email', email);
    const existingUser: IAuthDocument = await authService.getAuthUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }
    const resetToken: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const resetTokenString: string = resetToken.toString('hex');
    await authService.updatePasswordResetToken(resetTokenString, `${existingUser.id!}`, Date.now() * 60 * 60 * 1000);
    const resetLink = `${config.CLIENT_URL}/reset-password?token=${resetTokenString}`;
    const template = forgotPasswordTemplate.passwordResetTemplate(existingUser.username, resetLink);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: email, subject: 'Reset your password' });
    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent.' });
  }

  @JoiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void>{
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    const existingUser: IAuthDocument = await authService.getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Reset token has expired.');
    }

    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;
    await existingUser.save();

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    };

    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: existingUser.email!, subject: 'Password Reset Confirmation' });
    res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated.' });
  }
}
