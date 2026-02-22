import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { UpdatePropertyCommand } from '../../impl/update-property.command/update-property.command';
import { PropertyEntity } from '../../../entities/property.entity';
import { MediaEntity, MediaType } from '../../../entities/media.entity';
import { normalizeI18n } from '../../../dto/i18n.dto';
import { normalizePropertyImages } from '../../../dto/property-image.dto';

/**
 * Met à jour un bien (champs optionnels).
 * Si images fournies : remplace les médias du bien par la nouvelle liste (url, rank, is_primary, description i18n).
 */
@CommandHandler(UpdatePropertyCommand)
export class UpdatePropertyHandler implements ICommandHandler<UpdatePropertyCommand> {
  private readonly logger = new Logger(UpdatePropertyHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: UpdatePropertyCommand): Promise<PropertyEntity> {
    try {
      const repo = this.dataSource.getRepository(PropertyEntity);
      const existing = await repo.findOne({ where: { id: command.id } });
      if (!existing) throw new NotFoundException('Property not found');

      if (command.agent_id !== undefined) existing.agent_id = command.agent_id;
      if (command.name !== undefined) existing.name = command.name;
      if (command.building_type !== undefined) existing.building_type = command.building_type;
      if (command.address !== undefined) existing.address = command.address;
      if (command.city_id !== undefined) existing.city_id = command.city_id;
      if (command.gps_latitude !== undefined) existing.gps_latitude = String(command.gps_latitude);
      if (command.gps_longitude !== undefined) existing.gps_longitude = String(command.gps_longitude);
      if (command.main_image !== undefined) existing.main_image = command.main_image;
      if (command.gallery !== undefined) existing.gallery = command.gallery;
      if (command.description !== undefined) {
        existing.description = Object.keys(command.description).length ? normalizeI18n(command.description as Record<string, string>) : null;
      }
      if (command.status !== undefined) existing.status = command.status;

      const saved = await repo.save(existing);

      if (command.images !== undefined) {
        const imagesNorm = normalizePropertyImages(command.images);
        await this.dataSource.manager.transaction(async (manager) => {
          const mediaRepo = manager.getRepository(MediaEntity);
          await mediaRepo.delete({ property_id: command.id });
          for (const img of imagesNorm) {
            const media = mediaRepo.create({
              property_id: command.id,
              url: img.url,
              type: MediaType.IMAGE,
              rank: img.rank,
              is_primary: img.is_primary,
              description: img.description ?? null,
            });
            await mediaRepo.save(media);
          }
        });
        if (imagesNorm.length > 0 && !command.main_image) {
          const primary = imagesNorm.find((i) => i.is_primary) ?? imagesNorm[0];
          existing.main_image = primary.url;
          await repo.update({ id: command.id }, { main_image: primary.url });
        }
      }

      this.logger.log(`Property mise à jour: ${saved.id}`);
      const updated = await repo.findOne({ where: { id: command.id } });
      return updated ?? saved;
    } catch (error) {
      this.logger.error(`Erreur update property: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
