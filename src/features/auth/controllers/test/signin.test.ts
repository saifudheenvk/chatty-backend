/* eslint-disable @typescript-eslint/no-explicit-any */
import { authMock, authMockRequest, authMockResponse } from '@mocks/auth.mock';
import { Request, Response } from 'express';
import { SignIn } from '@auth/controllers/signin';
import { CustomError } from '@global/helpers/error-handler';
import { authService } from '@services/db/auth.service';
import { userService } from '@services/db/user.service';
import { Helper } from '@global/helpers/helper';
import { mergedAuthAndUserData } from '@mocks/user.mock';


const USERNAME = 'Manny';
const PASSWORD = 'manny1';
const WRONG_USERNAME = 'ma';
const WRONG_PASSWORD = 'ma';
const LONG_PASSWORD = 'mathematics1';
const LONG_USERNAME = 'mathematics';


jest.useFakeTimers();
jest.mock('@services/queues/base.queue');

describe('Sign In', ()=> {

  beforeEach(()=>{
    jest.resetAllMocks();
  });

  afterEach(()=>{
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should throw an error if username is not available', ()=>{
    const req: Request = authMockRequest({}, {
        username: '',
        password: PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.signin(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('should throw an error if username is less than min length', ()=>{
    const req: Request = authMockRequest({}, {
        username: WRONG_USERNAME,
        password: WRONG_PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.signin(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('should throw an error if username is greater than max length', ()=>{
    const req: Request = authMockRequest({}, {
        username: LONG_USERNAME,
        password: WRONG_PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.signin(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('should throw an error if password is not available', ()=>{
    const req: Request = authMockRequest({}, {
        username: USERNAME,
        password: ''
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.signin(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });

  it('should throw an error if password length is less than min length', ()=>{
    const req: Request = authMockRequest({}, {
        username: USERNAME,
        password: WRONG_PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.signin(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('should throw an error if password length is greater than maximum length', () => {
    const req: Request = authMockRequest({}, { username: USERNAME, password: LONG_PASSWORD }) as Request;
    const res: Response = authMockResponse();
    SignIn.prototype.signin(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('should throw an error if username does not exists', () => {
    const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getAuthUserByUserName').mockResolvedValue(null as any);

    SignIn.prototype.signin(req, res).catch((error: CustomError) => {
      expect(authService.getAuthUserByUserName).toHaveBeenCalledWith(Helper.convertFirstLetterUppercase(req.body.username)); // to check whether we call this function or not
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMockResponse();
    authMock.comparePassword = () => Promise.resolve(true);
    jest.spyOn(authService, 'getAuthUserByUserName').mockResolvedValue(authMock);
    jest.spyOn(userService, 'getUserByAuthId').mockResolvedValue(mergedAuthAndUserData);

    await SignIn.prototype.signin(req, res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User Successfully LoggedIn',
      user: mergedAuthAndUserData,
      token: req.session?.jwt
    });
  });
});
