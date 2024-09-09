import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import { notificationService } from '@services/db/notification.service';
import { Get } from '@notification/controllers/get-notification';
import { notificationData, notificationMockRequest, notificationMockResponse } from '@mocks/notification.mock';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/db/notification.service');

describe('Get', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should send correct json response', async () => {
    const req: Request = notificationMockRequest({}, authUserPayload, { notificationId: '12345' }) as Request;
    const res: Response = notificationMockResponse();
    jest.spyOn(notificationService, 'getNotifications').mockResolvedValue([notificationData]);

    await Get.prototype.notifications(req, res);
    expect(notificationService.getNotifications).toHaveBeenCalledWith(req.currentUser!.userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User notifications',
      notifications: [notificationData]
    });
  });
});
