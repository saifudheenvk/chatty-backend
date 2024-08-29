import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { commentRoutes } from '@comments/routes/commentRoutes';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { postRoutes } from '@post/routes/postRoutes';
import { reactionRoutes } from '@reaction/routes/reactionRotes';
import { serverAdapter } from '@services/queues/base.queue';
import { Application } from 'express';

export default (app: Application) => {
  const API_BASE_PATH = '/api/v1';
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(`${API_BASE_PATH}/auth`, authRoutes.routes());
    app.use(`${API_BASE_PATH}/auth`, authRoutes.signOutRoutes());

    app.use(`${API_BASE_PATH}/user`, authMiddleware.verifyUser, currentUserRoutes.routes());

    app.use(`${API_BASE_PATH}/post`, authMiddleware.verifyUser, postRoutes.routes());

    app.use(`${API_BASE_PATH}/reaction`, authMiddleware.verifyUser, reactionRoutes.routes());

    app.use(`${API_BASE_PATH}/comment`, authMiddleware.verifyUser, commentRoutes.routes());
  };

  routes();
};
