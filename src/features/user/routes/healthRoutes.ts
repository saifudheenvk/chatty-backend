import express, { Request, Response, Router } from 'express';
import { performance } from 'perf_hooks';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@root/config';
import moment from 'moment';
import axios from 'axios';


class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  //to check whether ther server is healthy or not?
  public health(): Router {
    this.router.get('/health', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.OK).json(`Health: Server instance is healthy with process id ${process.pid} on ${moment().format('LL')}`);
    });
    return this.router;
  }

  // To check whether the config works or not
  public env(): Router {
    this.router.get('/env', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.OK).json(`This is the ${config.NODE_ENV} environment`);
    });
    return this.router;
  }

  // To get instance Id
  public instance(): Router {
    this.router.get('/instance', async (req: Request, res: Response) => {
      const response = await axios({
        method: 'get',
        url: config.EC2_URL
      });
      res.status(HTTP_STATUS.OK).send(`Server is running on EC2 instance with id ${response.data} and process id ${process.pid} on ${moment().format('LL')}`);
    });
    return this.router;
  }

  public fiboRoutes(): Router {
    this.router.get('/fibo/:num', async (req: Request, res: Response) => {
      const { num } = req.params;
      const start: number = performance.now();
      const result: number = this.fibo(parseInt(num, 10));
      const end: number = performance.now();
      const time: number = end - start;
      // const response = await axios({
      //   method: 'get',
      //   url: config.EC2_URL
      // });
      res
        .status(HTTP_STATUS.OK)
        .send(
          `Fibonacci series of ${num} is ${result} and it took ${time}ms and runs with process id ${process.pid}  at ${moment().format('LL')}`
        );
    });
    return this.router;
  }

  private fibo(data: number): number {
    if (data < 2) {
      return 1;
    } else {
      return this.fibo(data - 2) + this.fibo(data - 1);
    }
  }
}

export const healthRoutes: HealthRoutes = new HealthRoutes();
