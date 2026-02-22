/**
 * User Controller - Standard 41DEVS
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { UploadAvatarService } from './upload-avatar.service';
import { UploadIdCardService } from './upload-id-card.service';

interface MulterFile {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly uploadAvatarService: UploadAvatarService,
    private readonly uploadIdCardService: UploadIdCardService,
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

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file?.mimetype?.startsWith('image/')) {
          return cb(new BadRequestException('Seules les images sont acceptées'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload photo de profil (avatar)' })
  async uploadAvatar(@Request() req: { user: { id: string }; protocol: string; get: (n: string) => string }, @UploadedFile() file: MulterFile) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.uploadAvatarService.saveAvatar(req.user.id, file, baseUrl);
  }

  @Post('id-card')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileInterceptor('id_card', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!file?.mimetype || !allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Format non autorisé (JPEG, PNG, WebP, PDF)'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { id_card: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload pièce d\'identité (KYC)' })
  async uploadIdCard(@Request() req: { user: { id: string }; protocol: string; get: (n: string) => string }, @UploadedFile() file: MulterFile) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.uploadIdCardService.saveIdCard(req.user.id, file, baseUrl);
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
