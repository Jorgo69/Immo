/**
 * Health Module - Standard 41DEVS
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HealthController } from './health.controller';
import { GetHealthHandler } from './queries/handlers/get-health.handler/get-health.handler';

@Module({
  imports: [CqrsModule],
  controllers: [HealthController],
  providers: [GetHealthHandler],
})
export class HealthModule {}
