/**
 * Module Property — biens immobiliers et médias.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyController } from './property.controller';
import { PropertyEntity } from './entities/property.entity';
import { MediaEntity } from './entities/media.entity';
import { RoomEntity } from './entities/room.entity';
import { CreatePropertyHandler } from './commands/handlers/create-property.handler/create-property.handler';
import { CreateRoomHandler } from './commands/handlers/create-room.handler/create-room.handler';
import { UpdatePropertyHandler } from './commands/handlers/update-property.handler/update-property.handler';
import { AddMediaHandler } from './commands/handlers/add-media.handler/add-media.handler';
import { GetPropertyByIdHandler } from './queries/handlers/get-property-by-id.handler/get-property-by-id.handler';
import { GetAllPropertiesHandler } from './queries/handlers/get-all-properties.handler/get-all-properties.handler';
import { GetMediaByPropertyHandler } from './queries/handlers/get-media-by-property.handler/get-media-by-property.handler';
import { SearchPropertiesHandler } from './queries/handlers/search-properties.handler/search-properties.handler';
import { SearchSemanticPropertiesHandler } from './queries/handlers/search-semantic-properties.handler/search-semantic-properties.handler';
import { SemanticSearchService } from './services/semantic-search.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PropertyEntity, MediaEntity, RoomEntity]),
  ],
  controllers: [PropertyController],
  providers: [
    CreatePropertyHandler,
    CreateRoomHandler,
    UpdatePropertyHandler,
    AddMediaHandler,
    GetPropertyByIdHandler,
    GetAllPropertiesHandler,
    GetMediaByPropertyHandler,
    SearchPropertiesHandler,
    SearchSemanticPropertiesHandler,
    SemanticSearchService,
  ],
})
export class PropertyModule {}
