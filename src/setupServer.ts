import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import 'express-async-errors';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import applicationRoutes from '@root/routes';
import Logger from 'bunyan';
import { CustomError, IErrorResponse } from '@global/helpers/error-handler';
import { config } from '@root/config';
import { SocketIOPostHandler } from '@sockets/post';
import { SocketIOFollowerHandler } from '@sockets/follower';
import { SocketIOUserHandler } from '@sockets/user';
import { SocketIONotificationHandler } from '@sockets/notification';
import { SocketIOImageHandler } from '@sockets/image';
import { SocketIOChatHandler } from '@sockets/chat';
import swaggerStats from 'swagger-stats';


const SERVER_PORT = 5001;

const logger: Logger = config.createLogger('server');

export class ChattyServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleWare(this.app);
    this.standardMiddleWare(this.app);
    this.routeMiddleWare(this.app);
    this.apiMonitoring(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleWare(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600 * 1000,
        secure: config.NODE_ENV !== 'development'
      })
    );
    app.use(helmet());
    app.use(hpp());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'DELETE']
      })
    );
  }

  private standardMiddleWare(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
  }

  private routeMiddleWare(app: Application): void {
    applicationRoutes(app);
  }

  private apiMonitoring(app: Application): void {
    app.use(swaggerStats.getMiddleware({
      uriPath: '/api-monitoring',
    }));
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((err: IErrorResponse, req: Request, res: Response, next: NextFunction) => {
      logger.error(err);
      if (err instanceof CustomError) {
        return res.status(err.statusCode).json(err.serializeErrors());
      }
      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      if (!config.JWT_TOKEN) {
        throw new Error('JWT_TOKEN must be provided');
      }
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketConnections(socketIO);
    } catch (error) {
      logger.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer);
    const pubClient = createClient({ url: config.REDIS_HOST });
    const subscriberClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subscriberClient.connect()]);
    io.adapter(createAdapter(pubClient, subscriberClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    logger.info(`Worker with process id of ${process.pid} has started...`);
    logger.info(`Server has started with pid: ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      logger.info(`Server Running On PORT: ${SERVER_PORT}`);
    });
  }

  private socketConnections(io: Server) {
    const followSocket: SocketIOFollowerHandler = new SocketIOFollowerHandler(io);
    const postSocket: SocketIOPostHandler = new SocketIOPostHandler(io);
    const userSocket: SocketIOUserHandler = new SocketIOUserHandler(io);
    const notificationSocket: SocketIONotificationHandler = new SocketIONotificationHandler();
    const socketIOImageHandler: SocketIOImageHandler = new SocketIOImageHandler();
    const socketIOChatHandler: SocketIOChatHandler = new SocketIOChatHandler(io);
    
    postSocket.listen();
    followSocket.listen();
    userSocket.listen();
    notificationSocket.listen(io);
    socketIOImageHandler.listen(io);
    socketIOChatHandler.listen();
  }
}
