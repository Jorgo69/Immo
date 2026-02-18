/**
 * Controller Property — biens immobiliers et médias.
 */
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePropertyCommand } from './commands/impl/create-property.command/create-property.command';
import { CreateRoomCommand } from './commands/impl/create-room.command/create-room.command';
import { UpdatePropertyCommand } from './commands/impl/update-property.command/update-property.command';
import { AddMediaCommand } from './commands/impl/add-media.command/add-media.command';
import { GetPropertyByIdQuery } from './queries/impl/get-property-by-id.query/get-property-by-id.query';
import { GetAllPropertiesQuery } from './queries/impl/get-all-properties.query/get-all-properties.query';
import { GetMediaByPropertyQuery } from './queries/impl/get-media-by-property.query/get-media-by-property.query';
import { SearchPropertiesQuery } from './queries/impl/search-properties.query/search-properties.query';
import { SearchSemanticPropertiesQuery } from './queries/impl/search-semantic-properties.query/search-semantic-properties.query';

@ApiTags('Property')
@Controller('property')
export class PropertyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un bien (owner_id dans le body)' })
  async create(@Body() command: CreatePropertyCommand) {
    return this.commandBus.execute(command);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un bien' })
  async update(@Param('id') id: string, @Body() body: Omit<UpdatePropertyCommand, 'id'>) {
    const command = new UpdatePropertyCommand();
    command.id = id;
    Object.assign(command, body);
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des biens (filtres: city, status, min_price, max_price)' })
  async getAll(@Query() query: GetAllPropertiesQuery) {
    return this.queryBus.execute(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Recherche par texte (titre, ville, description) + filtres optionnels' })
  async search(@Query() query: SearchPropertiesQuery) {
    return this.queryBus.execute(query);
  }

  @Get('semantic-search')
  @ApiOperation({
    summary: 'Recherche sémantique (IA) — stub (fallback texte tant que les embeddings ne sont pas configurés)',
  })
  async semanticSearch(@Query() query: SearchSemanticPropertiesQuery) {
    return this.queryBus.execute(query);
  }

  @Post(':propertyId/rooms')
  @ApiOperation({ summary: 'Ajouter une chambre à un bien' })
  async createRoom(
    @Param('propertyId') propertyId: string,
    @Body() body: Omit<CreateRoomCommand, 'property_id'>,
  ) {
    const command = new CreateRoomCommand();
    command.property_id = propertyId;
    Object.assign(command, body);
    return this.commandBus.execute(command);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un bien (avec médias)' })
  async getById(@Param('id') id: string) {
    const query = new GetPropertyByIdQuery();
    query.id = id;
    return this.queryBus.execute(query);
  }

  @Post('media')
  @ApiOperation({ summary: 'Ajouter un média à un bien' })
  async addMedia(@Body() command: AddMediaCommand) {
    return this.commandBus.execute(command);
  }

  @Get(':id/media')
  @ApiOperation({ summary: 'Médias d’un bien' })
  async getMedia(@Param('id') id: string) {
    const query = new GetMediaByPropertyQuery();
    query.property_id = id;
    return this.queryBus.execute(query);
  }
}
