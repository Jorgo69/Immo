import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentGatewayEntity } from './entities/payment-gateway.entity';
import { UserRole } from '../auth/models/user.model/user.model';

@ApiTags('Admin Payment')
@Controller('admin/payment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class PaymentAdminController {
  constructor(
    @InjectRepository(PaymentGatewayEntity)
    private readonly gatewayRepo: Repository<PaymentGatewayEntity>,
  ) {}

  @Get('gateways')
  @ApiOperation({ summary: 'Lister toutes les passerelles (Admin)' })
  async getAllGateways() {
    return this.gatewayRepo.find();
  }

  @Patch('gateways/:id')
  @ApiOperation({ summary: 'Modifier une passerelle (Activer/Pause/Config)' })
  async updateGateway(
    @Param('id') id: string,
    @Body() body: Partial<PaymentGatewayEntity>,
  ) {
    await this.gatewayRepo.update(id, body);
    return this.gatewayRepo.findOne({ where: { id } });
  }
}
