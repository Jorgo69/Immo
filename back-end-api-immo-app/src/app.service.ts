/**
 * App Service - Standard 41DEVS
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to NestJS CQRS API - Standard 41DEVS';
  }
}
