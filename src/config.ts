import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

dotenv.config({});

class Config {
  public DATABASE_URL: string | undefined;
  public JWT_TOKEN: string | undefined;
  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public NODE_ENV: string | undefined;
  public REDIS_HOST: string | undefined;
  public CLOUD_NAME: string | undefined;
  public CLOUD_API_KEY: string | undefined;
  public CLOUD_API_SECRET: string | undefined;
  public SENDER_MAIL: string | undefined;
  public SENDER_EMAIL_PASSWORD: string | undefined;
  public SENDGRID_API_KEY: string | undefined;
  public SENDGRID_SENDER: string | undefined;

  private readonly DEFAULT_DATABASE_URL = 'mongodb://localhost:27017/chatty';

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DATABASE_URL;
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
    this.CLOUD_NAME = process.env.CLOUD_NAME || '';
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '';
    this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || '';
    this.SENDER_MAIL = process.env.SENDER_MAIL || '';
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
    this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
    this.SENDGRID_SENDER = process.env.SENDGRID_SENDER || '';
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name: name, level: 'debug' });
  }

  public createCloudinaryConfig() {
    cloudinary.v2.config({
      cloud_name: this.CLOUD_NAME,
      api_secret: this.CLOUD_API_SECRET,
      api_key: this.CLOUD_API_KEY
    });
  }

  public validateConfig() {
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined) {
        throw new Error(`Configuration ${key} is undefined`);
      }
    }
  }
}

export const config: Config = new Config();
