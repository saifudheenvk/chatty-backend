import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { chatRoutes } from '@chat/routes/chatRoutes';
import { commentRoutes } from '@comments/routes/commentRoutes';
import { followRoutes } from '@follower/routes/followRotes';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { imageRoutes } from '@image/routes/imageRoutes';
import { postRoutes } from '@post/routes/postRoutes';
import { reactionRoutes } from '@reaction/routes/reactionRotes';
import { serverAdapter } from '@services/queues/base.queue';
import { healthRoutes } from '@user/routes/healthRoutes';
import { userRoutes } from '@user/routes/userRoutes';
import { Application } from 'express';

export default (app: Application) => {
  const API_BASE_PATH = '/api/v1';
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());

    app.use('', healthRoutes.health());
    app.use('', healthRoutes.env());
    app.use('', healthRoutes.instance());
    app.use('', healthRoutes.fiboRoutes());
    
    app.use(`${API_BASE_PATH}/auth`, authRoutes.routes());
    app.use(`${API_BASE_PATH}/auth`, authRoutes.signOutRoutes());

    app.use(`${API_BASE_PATH}/user`, authMiddleware.verifyUser, currentUserRoutes.routes());
    app.use(`${API_BASE_PATH}/post`, authMiddleware.verifyUser, postRoutes.routes());
    app.use(`${API_BASE_PATH}/reaction`, authMiddleware.verifyUser, reactionRoutes.routes());
    app.use(`${API_BASE_PATH}/comment`, authMiddleware.verifyUser, commentRoutes.routes());
    app.use(`${API_BASE_PATH}`, authMiddleware.verifyUser, followRoutes.routes());
    app.use(`${API_BASE_PATH}`, authMiddleware.verifyUser, imageRoutes.routes());
    app.use(`${API_BASE_PATH}`, authMiddleware.verifyUser, chatRoutes.routes());
    app.use(`${API_BASE_PATH}`, authMiddleware.verifyUser, userRoutes.routes());
  };

  routes();
};
