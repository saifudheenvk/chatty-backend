import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { serverAdapter } from '@services/queues/base.queue';
import { Application } from 'express';

export default (app: Application) => {
  const API_BASE_PATH = '/api/v1';
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(`${API_BASE_PATH}/auth`, authRoutes.routes());
    app.use(`${API_BASE_PATH}/auth`, authRoutes.routes());

    app.use(`${API_BASE_PATH}/user`, authMiddleware.verifyUser, currentUserRoutes.routes());
  };

  routes();
};
