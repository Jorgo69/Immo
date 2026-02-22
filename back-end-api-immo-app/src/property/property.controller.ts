/**
 * Controller Property — biens immobiliers et médias (ARCHITECTURE §1, §5, §7).
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { UploadPropertyImageService } from './services/upload-property-image.service';

interface MulterFile {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}
import { CreatePropertyCommand } from './commands/impl/create-property.command/create-property.command';
import { CreateUnitCommand } from './commands/impl/create-unit.command/create-unit.command';
import { UpdatePropertyCommand } from './commands/impl/update-property.command/update-property.command';
import { UpdateUnitCommand } from './commands/impl/update-unit.command/update-unit.command';
import { AddMediaCommand } from './commands/impl/add-media.command/add-media.command';
import { DeletePropertyCommand } from './commands/impl/delete-property.command/delete-property.command';
import { DeleteUnitCommand } from './commands/impl/delete-unit.command/delete-unit.command';
import { GetPropertyByIdQuery } from './queries/impl/get-property-by-id.query/get-property-by-id.query';
import { GetAllPropertiesQuery } from './queries/impl/get-all-properties.query/get-all-properties.query';
import { GetPropertiesByOwnerQuery } from './queries/impl/get-properties-by-owner.query/get-properties-by-owner.query';
import { GetMediaByPropertyQuery } from './queries/impl/get-media-by-property.query/get-media-by-property.query';
import { SearchPropertiesQuery } from './queries/impl/search-properties.query/search-properties.query';
import { SearchSemanticPropertiesQuery } from './queries/impl/search-semantic-properties.query/search-semantic-properties.query';

@ApiTags('Property')
@Controller('property')
export class PropertyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly uploadPropertyImageService: UploadPropertyImageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer un bien (owner_id = utilisateur connecté uniquement)' })
  async create(@Request() req: { user?: { id: string } }, @Body() body: CreatePropertyCommand) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new Error('Non authentifié');
    const command = new CreatePropertyCommand();
    Object.assign(command, body);
    command.owner_id = ownerId;
    return this.commandBus.execute(command);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload une image pour un bien ; retourne l’URL à envoyer dans CreatePropertyCommand.images' })
  async uploadImage(@UploadedFile() file: MulterFile) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé');
    return this.uploadPropertyImageService.saveImage(file);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un bien' })
  async update(@Param('id') id: string, @Body() body: Omit<UpdatePropertyCommand, 'id'>) {
    const command = new UpdatePropertyCommand();
    command.id = id;
    Object.assign(command, body);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer un bien (cascade : unités et médias en soft delete)' })
  async delete(
    @Request() req: { user?: { id: string } },
    @Param('id') id: string,
  ) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new Error('Non authentifié');
    const command = new DeletePropertyCommand();
    command.id = id;
    command.owner_id = ownerId;
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des biens (filtres: city, status, min_price, max_price)' })
  async getAll(@Query() query: GetAllPropertiesQuery) {
    return this.queryBus.execute(query);
  }

  @Get('owner/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Liste des biens du propriétaire connecté (landlord)' })
  async getMyProperties(
    @Request() req: { user?: { id: string } },
    @Query() query: Omit<GetPropertiesByOwnerQuery, 'owner_id'>,
  ) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new Error('Non authentifié');
    const q = new GetPropertiesByOwnerQuery();
    q.owner_id = ownerId;
    Object.assign(q, query);
    return this.queryBus.execute(q);
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

  @Post(':propertyId/units')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter une unité (chambre/appart) à un bien' })
  async createUnit(
    @Param('propertyId') propertyId: string,
    @Body() body: Omit<CreateUnitCommand, 'property_id'>,
  ) {
    const command = new CreateUnitCommand();
    command.property_id = propertyId;
    Object.assign(command, body);
    return this.commandBus.execute(command);
  }

  @Put(':propertyId/units/:unitId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Modifier une unité' })
  async updateUnit(
    @Param('propertyId') _propertyId: string,
    @Param('unitId') unitId: string,
    @Body() body: Omit<UpdateUnitCommand, 'id'>,
  ) {
    const command = new UpdateUnitCommand();
    command.id = unitId;
    Object.assign(command, body);
    return this.commandBus.execute(command);
  }

  @Delete(':propertyId/units/:unitId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer une unité (soft delete)' })
  async deleteUnit(
    @Request() req: { user?: { id: string } },
    @Param('propertyId') propertyId: string,
    @Param('unitId') unitId: string,
  ) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new Error('Non authentifié');
    const command = new DeleteUnitCommand();
    command.id = unitId;
    command.property_id = propertyId;
    command.owner_id = ownerId;
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
