/**
 * Health Controller - Standard 41DEVS
 */
import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHealthQuery } from './queries/impl/get-health.query/get-health.query';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  async getHealth() {
    return this.queryBus.execute(new GetHealthQuery());
  }
}
