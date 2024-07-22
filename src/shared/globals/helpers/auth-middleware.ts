import { NextFunction, Request, Response } from 'express';
import { UnAuthorizedError } from './error-handler';
import { config } from '@root/config';
import { AuthPayload } from '@auth/interfaces/auth.interface';
import JWT from 'jsonwebtoken';

export class AuthMiddleware {
  public verifyUser(req: Request, res: Response, next: NextFunction) {
    if (!req.session?.jwt) {
      throw new UnAuthorizedError('Token is not available. Please login again.');
    }

    try {
      const payload: AuthPayload = JWT.verify(req.session?.jwt, config.JWT_TOKEN!) as AuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new UnAuthorizedError('Token is invalid. Please login again.');
    }
    next();
  }

  public checkAuthentication(req: Request, _res: Response, next: NextFunction): void {
    if (!req.currentUser) {
      throw new UnAuthorizedError('Authentication is required to access this route.');
    }
    next();
  }
}
export const authMiddleware: AuthMiddleware = new AuthMiddleware();
