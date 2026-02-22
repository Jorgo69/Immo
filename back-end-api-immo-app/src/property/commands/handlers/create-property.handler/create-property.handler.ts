import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { CreatePropertyCommand } from '../../impl/create-property.command/create-property.command';
import { PropertyEntity, PropertyStatus, PropertyBuildingType } from '../../../entities/property.entity';
import { MediaEntity, MediaType } from '../../../entities/media.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';
import { normalizeI18n } from '../../../dto/i18n.dto';
import { normalizePropertyImages } from '../../../dto/property-image.dto';

/**
 * Crée un bien (La Maison).
 * - Titre de propriété (title_deed) chiffré via EncryptionService + owner.encryption_salt.
 * - Traçabilité : created_by = owner_id (utilisateur connecté).
 * - Description i18n (fr par défaut). Images : table media (url, rank, is_primary, description i18n).
 */
@CommandHandler(CreatePropertyCommand)
export class CreatePropertyHandler implements ICommandHandler<CreatePropertyCommand> {
  private readonly logger = new Logger(CreatePropertyHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(command: CreatePropertyCommand): Promise<PropertyEntity> {
    try {
      if (!command.owner_id) {
        throw new Error('owner_id requis');
      }
      const userRepo = this.dataSource.getRepository(UserModel);
      let user = await userRepo.findOne({
        where: { id: command.owner_id },
        select: ['id', 'encryption_salt'],
      });
      if (!user) {
        throw new Error('Propriétaire introuvable');
      }
      if (!user.encryption_salt) {
        user.encryption_salt = crypto.randomBytes(24).toString('hex');
        await userRepo.update({ id: command.owner_id }, { encryption_salt: user.encryption_salt });
      }

      let title_deed_enc: string | null = null;
      if (command.title_deed?.trim()) {
        title_deed_enc = this.encryption.encrypt(command.title_deed.trim(), user.encryption_salt);
      }

      const descriptionNorm = command.description ? normalizeI18n(command.description as Record<string, string>) : null;
      const imagesNorm = normalizePropertyImages(command.images);

      return await this.dataSource.manager.transaction(async (manager) => {
        const repo = manager.getRepository(PropertyEntity);
        const entity = repo.create({
          owner_id: command.owner_id,
          agent_id: command.agent_id ?? null,
          created_by: command.owner_id,
          name: (command.name?.trim() || 'Sans nom'),
          building_type: command.building_type ?? PropertyBuildingType.VILLA,
          address: command.address?.trim() ?? '',
          city_id: command.city_id,
          gps_latitude: command.gps_latitude != null ? String(command.gps_latitude) : null,
          gps_longitude: command.gps_longitude != null ? String(command.gps_longitude) : null,
          main_image: command.main_image ?? (imagesNorm[0]?.url ?? null),
          gallery: Array.isArray(command.gallery) ? command.gallery : imagesNorm.map((i) => i.url),
          description: descriptionNorm,
          title_deed_enc,
          status: command.status ?? PropertyStatus.AVAILABLE,
        });
        const saved = await repo.save(entity);

        const mediaRepo = manager.getRepository(MediaEntity);
        for (const img of imagesNorm) {
          const media = mediaRepo.create({
            property_id: saved.id,
            url: img.url,
            type: MediaType.IMAGE,
            rank: img.rank,
            is_primary: img.is_primary,
            description: img.description ?? null,
          });
          await mediaRepo.save(media);
        }

        this.logger.log(`Property créée: ${saved.id}`);
        return saved;
      });
    } catch (error) {
      this.logger.error(`Erreur create property: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
