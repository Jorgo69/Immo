/**
 * Controller Location — pays et villes (référentiel).
 * GET : tout le monde (pour select propriétaire).
 * POST : Admin uniquement.
 */
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';
import { CreateCountryCommand } from './commands/impl/create-country.command/create-country.command';
import { CreateCityCommand } from './commands/impl/create-city.command/create-city.command';
import { GetCountriesQuery } from './queries/impl/get-countries.query/get-countries.query';
import { GetCitiesQuery } from './queries/impl/get-cities.query/get-cities.query';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('countries')
  @ApiOperation({ summary: 'Liste des pays (pour select)' })
  async getCountries() {
    return this.queryBus.execute(new GetCountriesQuery());
  }

  @Get('cities')
  @ApiOperation({ summary: 'Liste des villes (optionnel: country_id)' })
  async getCities(@Query() query: GetCitiesQuery) {
    return this.queryBus.execute(query);
  }

  @Post('countries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un pays (Admin)' })
  async createCountry(@Body() command: CreateCountryCommand) {
    return this.commandBus.execute(command);
  }

  @Post('cities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une ville (Admin)' })
  async createCity(@Body() command: CreateCityCommand) {
    return this.commandBus.execute(command);
  }
}
