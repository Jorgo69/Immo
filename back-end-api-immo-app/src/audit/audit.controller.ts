import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
// Plus tard, on pourra utiliser le @RequirePermissions() ici pour restreindre à l'Admin pur.

@ApiTags('Audit Logs')
@Controller('audit')
// @UseGuards(JwtAuthGuard) // A décommenter et sécuriser par rôle Admin
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les journaux d\'audit (Réservé Admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async getLogs(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @Query('action') action?: any,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
  ) {
    const filters: any = {};
    if (action) filters.action = action;
    if (entityType) filters.entity_type = entityType;
    if (userId) filters.user_id = userId;

    const [logs, total] = await this.auditService.getLogs(Number(limit), Number(offset), filters);

    return {
      data: logs,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    };
  }
}
