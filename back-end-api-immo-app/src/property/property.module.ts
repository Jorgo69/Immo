/**
 * Module Property — biens immobiliers (La Maison), unités (chambres/apparts), médias.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModule } from '../location/location.module';
import { PropertyController } from './property.controller';
import { PropertyEntity } from './entities/property.entity';
import { MediaEntity } from './entities/media.entity';
import { UnitEntity } from './entities/unit.entity';
import { CreatePropertyHandler } from './commands/handlers/create-property.handler/create-property.handler';
import { CreateUnitHandler } from './commands/handlers/create-unit.handler/create-unit.handler';
import { UpdatePropertyHandler } from './commands/handlers/update-property.handler/update-property.handler';
import { UpdateUnitHandler } from './commands/handlers/update-unit.handler/update-unit.handler';
import { AddMediaHandler } from './commands/handlers/add-media.handler/add-media.handler';
import { DeletePropertyHandler } from './commands/handlers/delete-property.handler/delete-property.handler';
import { DeleteUnitHandler } from './commands/handlers/delete-unit.handler/delete-unit.handler';
import { GetPropertyByIdHandler } from './queries/handlers/get-property-by-id.handler/get-property-by-id.handler';
import { GetAllPropertiesHandler } from './queries/handlers/get-all-properties.handler/get-all-properties.handler';
import { GetMediaByPropertyHandler } from './queries/handlers/get-media-by-property.handler/get-media-by-property.handler';
import { SearchPropertiesHandler } from './queries/handlers/search-properties.handler/search-properties.handler';
import { SearchSemanticPropertiesHandler } from './queries/handlers/search-semantic-properties.handler/search-semantic-properties.handler';
import { GetPropertiesByOwnerHandler } from './queries/handlers/get-properties-by-owner.handler/get-properties-by-owner.handler';
import { SemanticSearchService } from './services/semantic-search.service';
import { UploadPropertyImageService } from './services/upload-property-image.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PropertyEntity, MediaEntity, UnitEntity]),
    LocationModule,
  ],
  controllers: [PropertyController],
  providers: [
    UploadPropertyImageService,
    CreatePropertyHandler,
    CreateUnitHandler,
    UpdatePropertyHandler,
    UpdateUnitHandler,
    AddMediaHandler,
    DeletePropertyHandler,
    DeleteUnitHandler,
    GetPropertyByIdHandler,
    GetAllPropertiesHandler,
    GetPropertiesByOwnerHandler,
    GetMediaByPropertyHandler,
    SearchPropertiesHandler,
    SearchSemanticPropertiesHandler,
    SemanticSearchService,
  ],
})
export class PropertyModule {}
