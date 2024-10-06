import express, { Express } from 'express';
import { ChattyServer } from '@root/setupServer';
import databaseConnection from '@root/setupDatabase';
import { config } from '@root/config';
import Logger from 'bunyan';


const logger: Logger = config.createLogger('app');

class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app);
    server.start();
    Application.handleExits();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.createCloudinaryConfig();
  }

  // Even though we have global error handler. We are npt able to handle some errors. So to handle those errors we can use this.
  private static handleExits(): void {
    process.on('uncaughtException', (error: Error) => {
      logger.error(`There was an uncaught exception: ${error}`);
      Application.shutDownProperly(1);
    });

    process.on('unhandledRejection', (error: Error) => {
      logger.error(`There was an unhandled rejection: ${error}`);
      Application.shutDownProperly(2);
    });

    //SIGTERM is setnt when we enter  kill commands 
    process.on('SIGTERM', () => {
      logger.error('Caught SIGTERM');
      Application.shutDownProperly(2);
    });

    //SIGINT is sent when we press ctrl + c
    process.on('SIGINT', () => {
      logger.error('Caught SIGINT');
      Application.shutDownProperly(2);
    });


    process.on('exit', () => {
      logger.error('Exiting');
    });
  }

  private static shutDownProperly(exitCode: number): void {
    Promise.resolve().then(() => {
      logger.info('Shutdown complete');
      process.exit(exitCode);
    }).catch((error: Error) => {
      logger.error(`Error occurred while shutting down: ${error.message}`);
      process.exit(1);
    });
  }
}

const application: Application = new Application();
application.initialize();
