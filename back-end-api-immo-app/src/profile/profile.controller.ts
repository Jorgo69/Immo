import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { UpdateProfileCommand } from './commands/impl/update-profile.command/update-profile.command';
import { AddPaymentMethodCommand } from './commands/impl/add-payment-method.command/add-payment-method.command';
import { GetProfileByUserQuery } from './queries/impl/get-profile-by-user.query/get-profile-by-user.query';
import { GetPaymentMethodsQuery } from './queries/impl/get-payment-methods.query/get-payment-methods.query';
import { PaymentMethodType } from './entities/payment-method.entity';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil KYC (données déchiffrées)' })
  async getMe(@Request() req: { user: { id: string } }) {
    const query = new GetProfileByUserQuery();
    query.userId = req.user.id;
    return this.queryBus.execute(query);
  }

  @Put('me')
  @ApiOperation({ summary: 'Mettre à jour mon profil (noms, pièce d’identité — chiffrés)' })
  async updateMe(
    @Body() body: Omit<UpdateProfileCommand, 'userId'>,
    @Request() req: { user: { id: string } },
  ) {
    const command = new UpdateProfileCommand();
    command.userId = req.user.id;
    command.full_name = body.full_name;
    command.id_card = body.id_card;
    command.profession = body.profession;
    command.company = body.company;
    command.emergency_contact = body.emergency_contact;
    command.preferred_zone = body.preferred_zone;
    command.preferred_zones = body.preferred_zones;
    command.budget_min = body.budget_min;
    command.budget_max = body.budget_max;
    return this.commandBus.execute(command);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Liste des méthodes de paiement (masquées)' })
  async getPaymentMethods(@Request() req: { user: { id: string } }) {
    const query = new GetPaymentMethodsQuery();
    query.userId = req.user.id;
    return this.queryBus.execute(query);
  }

  @Post('payment-methods')
  @ApiOperation({ summary: 'Ajouter une méthode de paiement (token gateway + last4/brand chiffrés)' })
  async addPaymentMethod(
    @Body() body: { type: PaymentMethodType; gateway_token: string; last4?: string; brand?: string },
    @Request() req: { user: { id: string } },
  ) {
    const command = new AddPaymentMethodCommand();
    command.userId = req.user.id;
    command.type = body.type;
    command.gateway_token = body.gateway_token;
    command.last4 = body.last4;
    command.brand = body.brand;
    return this.commandBus.execute(command);
  }
}
