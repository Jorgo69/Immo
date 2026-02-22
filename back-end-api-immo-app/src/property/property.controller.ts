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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour un bien (réservé au propriétaire)' })
  async update(
    @Request() req: { user?: { id: string } },
    @Param('id') id: string,
    @Body() body: Omit<UpdatePropertyCommand, 'id' | 'requested_by'>,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Non authentifié');
    const command = new UpdatePropertyCommand();
    command.id = id;
    command.requested_by = userId;
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

  @Post('units')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer une unité (rattachée ou indépendante). Body : property_id? (null = unité autonome), owner_id si autonome, ref_type_id, …' })
  async createUnitStandalone(
    @Request() req: { user?: { id: string } },
    @Body() body: CreateUnitCommand,
  ) {
    const command = new CreateUnitCommand();
    Object.assign(command, body);
    if (body.property_id == null && body.owner_id == null && req.user?.id) {
      command.owner_id = req.user.id;
    }
    return this.commandBus.execute(command);
  }

  @Post(':propertyId/units')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter une unité à un bien existant (property_id injecté depuis l’URL)' })
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
  @ApiOperation({ summary: 'Modifier une unité (réservé au propriétaire)' })
  async updateUnit(
    @Request() req: { user?: { id: string } },
    @Param('propertyId') _propertyId: string,
    @Param('unitId') unitId: string,
    @Body() body: Omit<UpdateUnitCommand, 'id' | 'requested_by'>,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Non authentifié');
    const command = new UpdateUnitCommand();
    command.id = unitId;
    command.requested_by = userId;
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter un média à un bien (réservé au propriétaire)' })
  async addMedia(@Request() req: { user?: { id: string } }, @Body() body: Omit<AddMediaCommand, 'requested_by'>) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Non authentifié');
    const command = new AddMediaCommand();
    Object.assign(command, body);
    command.requested_by = userId;
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
