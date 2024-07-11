import { Application, json, urlencoded, Response, Request, NextFunction } from "express"
import http from "http";
import cors from "cors";
import hpp from "hpp";
import cookieSession  from "cookie-session";
import HTTP_STATUS from "http-status-codes";
import "express-async-errors"
import helmet from "helmet";
import compression from "compression"
import { config } from "./config";
import { createClient } from "redis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import applicationRoutes from "./routes";


const SERVER_PORT = 5001;


export class ChattyServer {
    private app: Application;

    constructor(app: Application) {
        this.app = app
    }

    public start(): void {
        this.securityMiddleWare(this.app)
        this.standardMiddleWare(this.app)
        this.routeMiddleWare(this.app)
        this.globalErrorHandler(this.app)
        this.startServer(this.app)

    }


    private securityMiddleWare(app: Application): void {
        app.use(cookieSession({
            name: "session",
            keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
            maxAge: 24 * 7 * 3600,
            secure: config.NODE_ENV !== "development"
        }))
        app.use(helmet())
        app.use(hpp())
        app.use(cors({
            origin: config.CLIENT_URL,
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"]
        }))
    }

    private standardMiddleWare(app: Application): void {
        app.use(compression())
        app.use(json({limit: "50mb"}))
        app.use(urlencoded({limit: "50mb", extended: true}))
    }

    private routeMiddleWare(app: Application): void {
        applicationRoutes(app)
    }

    private globalErrorHandler(app: Application): void {}

    private async startServer(app: Application): Promise<void> {
        try {
            const httpServer: http.Server = new http.Server(app)
            const socketIO: Server = await this.createSocketIO(httpServer)
            this.startHttpServer(httpServer)
            this.socketConnections(socketIO)
        } catch (error) {
            console.log(error)
        }
    }

    private async createSocketIO(httpServer: http.Server): Promise<Server> {
        const io: Server = new Server(httpServer);
        const pubClient = createClient({ url: config.REDIS_HOST })
        const subscriberClient = pubClient.duplicate()
        await Promise.all([pubClient.connect(), subscriberClient.connect()])
        io.adapter(createAdapter(pubClient, subscriberClient))
        return io;
    }

    private startHttpServer(httpServer: http.Server): void {
        console.log(`Server has started with pid: ${process.pid}`)
        httpServer.listen(SERVER_PORT, () => {
            console.log(`Server Running On PORT: ${SERVER_PORT}`)
        })
    }


    private socketConnections(io: Server) {}

}