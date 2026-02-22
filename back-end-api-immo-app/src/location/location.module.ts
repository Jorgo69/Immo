/**
 * Module Location — référentiel pays et villes (Admin crée, propriétaire sélectionne).
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './location.controller';
import { CountryEntity } from './entities/country.entity';
import { CityEntity } from './entities/city.entity';
import { CreateCountryHandler } from './commands/handlers/create-country.handler/create-country.handler';
import { CreateCityHandler } from './commands/handlers/create-city.handler/create-city.handler';
import { GetCountriesHandler } from './queries/handlers/get-countries.handler/get-countries.handler';
import { GetCitiesHandler } from './queries/handlers/get-cities.handler/get-cities.handler';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CountryEntity, CityEntity])],
  controllers: [LocationController],
  providers: [
    CreateCountryHandler,
    CreateCityHandler,
    GetCountriesHandler,
    GetCitiesHandler,
  ],
  exports: [TypeOrmModule],
})
export class LocationModule {}
