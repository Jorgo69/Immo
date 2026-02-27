/**
 * Module Location — référentiel pays et villes (Admin crée, propriétaire sélectionne).
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './location.controller';
import { CountryEntity } from './entities/country.entity';
import { CityEntity } from './entities/city.entity';
import { NeighborhoodEntity } from './entities/neighborhood.entity';
import { CreateCountryHandler } from './commands/handlers/create-country.handler/create-country.handler';
import { CreateCityHandler } from './commands/handlers/create-city.handler/create-city.handler';
import { GetCountriesHandler } from './queries/handlers/get-countries.handler/get-countries.handler';
import { GetCitiesHandler } from './queries/handlers/get-cities.handler/get-cities.handler';

import { CreateNeighborhoodHandler } from './commands/handlers/create-neighborhood.handler/create-neighborhood.handler';
import { DeleteNeighborhoodHandler } from './commands/handlers/delete-neighborhood.handler/delete-neighborhood.handler';
import { GetNeighborhoodsHandler } from './queries/handlers/get-neighborhoods.handler/get-neighborhoods.handler';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CountryEntity, CityEntity, NeighborhoodEntity])],
  controllers: [LocationController],
  providers: [
    CreateCountryHandler,
    CreateCityHandler,
    GetCountriesHandler,
    GetCitiesHandler,
    CreateNeighborhoodHandler,
    DeleteNeighborhoodHandler,
    GetNeighborhoodsHandler,
  ],
  exports: [TypeOrmModule],
})
export class LocationModule {}
