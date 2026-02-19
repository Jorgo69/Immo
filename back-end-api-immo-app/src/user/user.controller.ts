/**
 * User Controller - Standard 41DEVS
 */
import { Body, Controller, Delete, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetAllQuery } from './queries/impl/get-all.query/get-all.query';
import { FindByIdQuery } from './queries/impl/find-by-id.query/find-by-id.query';
import { GetUserDetailQuery } from './queries/impl/get-user-detail.query/get-user-detail.query';
import { CreateUserCommand } from './commands/impl/create-user.command/create-user.command';
import { UpdateProfileCommand } from './commands/impl/update-profile.command/update-profile.command';
import { UpdateUserCommand } from './commands/impl/update-user.command/update-user.command';
import { DeleteUserCommand } from './commands/impl/delete-user.command/delete-user.command';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';
import { GetTransactionsQuery } from '../wallet/queries/impl/get-transactions.query/get-transactions.query';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users (admin)' })
  async getAll(@Query() query: GetAllQuery) {
    return this.queryBus.execute(query);
  }

  @Get('by-id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  async getById(@Query() query: FindByIdQuery) {
    return this.queryBus.execute(query);
  }

  @Get('detail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user detail with stats (admin)' })
  async getDetail(@Query() query: GetUserDetailQuery) {
    return this.queryBus.execute(query);
  }

  @Get('detail/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Transactions d’un utilisateur (admin, ex. détail locataire)' })
  async getDetailTransactions(
    @Query('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const query = new GetTransactionsQuery();
    query.userId = userId;
    query.page = page;
    query.limit = limit;
    return this.queryBus.execute(query);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer un utilisateur (admin ou formulaire complet)' })
  async create(@Body() command: CreateUserCommand) {
    return this.commandBus.execute(command);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Compléter le profil (onboarding après première connexion)' })
  async updateProfile(@Body() command: UpdateProfileCommand, @Request() req) {
    command.id = req.user.id;
    return this.commandBus.execute(command);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user' })
  async update(@Body() command: UpdateUserCommand, @Request() req) {
    command.id = req.user.id;
    return this.commandBus.execute(command);
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete current user' })
  async delete(@Body() command: DeleteUserCommand, @Request() req) {
    command.id = req.user.id;
    return this.commandBus.execute(command);
  }
}
