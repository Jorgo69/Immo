/**
 * Controller Rental — demandes de location (POST, GET, Accept, Reject).
 */
import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { CreateRentalRequestCommand } from './commands/impl/create-rental-request.command/create-rental-request.command';
import { GetRentalRequestsForLandlordQuery } from './queries/impl/get-rental-requests-for-landlord.query/get-rental-requests-for-landlord.query';
import { GetRentalRequestsForTenantQuery } from './queries/impl/get-rental-requests-for-tenant.query/get-rental-requests-for-tenant.query';
import { AcceptRentalRequestCommand } from './commands/impl/accept-rental-request.command/accept-rental-request.command';
import { RejectRentalRequestCommand } from './commands/impl/reject-rental-request.command/reject-rental-request.command';

@ApiTags('Rental')
@Controller('rental')
export class RentalController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer une demande de location (locataire)' })
  async createRequest(
    @Request() req: { user?: { id: string } },
    @Body() body: CreateRentalRequestDto,
  ) {
    const tenantId = req.user?.id;
    if (!tenantId) throw new Error('Non authentifié');
    const command = new CreateRentalRequestCommand();
    command.unit_id = body.unit_id;
    command.tenant_id = tenantId;
    command.message = body.message;
    command.desired_move_in_at = body.desired_move_in_at;
    return this.commandBus.execute(command);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Liste des demandes (landlord ou tenant selon ?for=landlord|tenant)' })
  async getRequests(
    @Request() req: { user?: { id: string } },
    @Query('for') forParam?: string,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Non authentifié');
    if (forParam === 'landlord') {
      const query = new GetRentalRequestsForLandlordQuery();
      query.landlord_id = userId;
      return this.queryBus.execute(query);
    }
    const query = new GetRentalRequestsForTenantQuery();
    query.tenant_id = userId;
    return this.queryBus.execute(query);
  }

  @Patch('requests/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accepter une demande (propriétaire) — unit → OCCUPIED, autres demandes refusées' })
  async acceptRequest(
    @Request() req: { user?: { id: string } },
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Non authentifié');
    const command = new AcceptRentalRequestCommand();
    command.request_id = id;
    command.responded_by = userId;
    return this.commandBus.execute(command);
  }

  @Patch('requests/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refuser une demande (propriétaire)' })
  async rejectRequest(
    @Request() req: { user?: { id: string } },
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Non authentifié');
    const command = new RejectRentalRequestCommand();
    command.request_id = id;
    command.responded_by = userId;
    return this.commandBus.execute(command);
  }
}
