/**
 * Get Health Handler - Standard 41DEVS
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetHealthQuery } from '../../impl/get-health.query/get-health.query';

@QueryHandler(GetHealthQuery)
export class GetHealthHandler implements IQueryHandler<GetHealthQuery> {
  async execute(query: GetHealthQuery): Promise<any> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'API NestJS CQRS - Standard 41DEVS',
    };
  }
}
