import { Body, Controller, Post, UseGuards, Request, Param, Put, Get } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { CreateLeaseCommand } from './commands/impl/create-lease.command/create-lease.command';
import { SignLeaseCommand } from './commands/impl/sign-lease.command/sign-lease.command';
import { GetMyLeasesQuery } from './queries/impl/get-my-leases.query/get-my-leases.query';

@Controller('leases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('my')
  async findAllMyLeases(@Request() req: any) {
    return this.queryBus.execute(new GetMyLeasesQuery(req.user.id));
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LANDLORD, UserRole.AGENT)
  async create(@Request() req: any, @Body() dto: CreateLeaseDto) {
    return this.commandBus.execute(
      new CreateLeaseCommand(
        req.user.id,
        dto.tenantId,
        dto.propertyId,
        dto.unitId || null,
        dto.monthlyRent,
        dto.depositAmount,
        dto.startDate,
        dto.endDate || null,
        dto.contractType,
        dto.contractContent,
      ),
    );
  }

  @Put(':id/sign')
  async sign(@Request() req: any, @Param('id') leaseId: string) {
    return this.commandBus.execute(new SignLeaseCommand(leaseId, req.user.id));
  }
}
