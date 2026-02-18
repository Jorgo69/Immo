import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { UpdateProfileCommand } from './commands/impl/update-profile.command/update-profile.command';
import { GetProfileByUserQuery } from './queries/impl/get-profile-by-user.query/get-profile-by-user.query';

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
    return this.commandBus.execute(command);
  }
}
