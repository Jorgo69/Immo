import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UpdateUnitCommand } from '../../impl/update-unit.command/update-unit.command';
import { UnitEntity } from '../../../entities/unit.entity';
import { PropertyEntity } from '../../../entities/property.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';
import { normalizeI18n } from '../../../dto/i18n.dto';
import { normalizeFeaturesI18n } from '../../../dto/features-i18n.dto';
import { normalizeUnitImages } from '../../../dto/unit-image.dto';

/**
 * Met à jour une unité (chambre/appart).
 * Champs optionnels ; description/features en i18n, images normalisées (rank, is_primary).
 * management_docs (sensible) chiffré via EncryptionService + owner.encryption_salt.
 */
@CommandHandler(UpdateUnitCommand)
export class UpdateUnitHandler implements ICommandHandler<UpdateUnitCommand> {
  private readonly logger = new Logger(UpdateUnitHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(command: UpdateUnitCommand): Promise<UnitEntity> {
    try {
      const repo = this.dataSource.getRepository(UnitEntity);
      const existing = await repo.findOne({ where: { id: command.id }, relations: ['property'] });
      if (!existing) throw new NotFoundException('Unit not found');

      if (command.property_id !== undefined) existing.property_id = command.property_id;
      if (command.name !== undefined) existing.name = command.name;
      if (command.type !== undefined) existing.type = command.type;
      if (command.price !== undefined) existing.price = String(command.price);
      if (command.description !== undefined) {
        existing.description = command.description && Object.keys(command.description).length
          ? normalizeI18n(command.description as Record<string, string>)
          : null;
      }
      if (command.features !== undefined) {
        existing.features = normalizeFeaturesI18n(command.features);
      }
      if (command.images !== undefined) {
        existing.images = normalizeUnitImages(command.images);
      }
      if (command.is_available !== undefined) existing.is_available = command.is_available;
      if (command.surface_m2 !== undefined) existing.surface_m2 = command.surface_m2;
      if (command.floor !== undefined) existing.floor = command.floor;
      if (command.caution_months !== undefined) existing.caution_months = command.caution_months;
      if (command.avance_months !== undefined) existing.avance_months = command.avance_months;
      if (command.frais_dossier !== undefined) existing.frais_dossier = command.frais_dossier != null ? String(command.frais_dossier) : null;
      if (command.prepaid_electricity !== undefined) existing.prepaid_electricity = command.prepaid_electricity;
      if (command.water_included !== undefined) existing.water_included = command.water_included;

      if (command.management_docs !== undefined) {
        const prop = await this.dataSource.getRepository(PropertyEntity).findOne({
          where: { id: existing.property_id },
          select: { owner_id: true },
        });
        if (prop?.owner_id) {
          const userRepo = this.dataSource.getRepository(UserModel);
          let user = await userRepo.findOne({
            where: { id: prop.owner_id },
            select: ['encryption_salt'],
          });
          if (!user?.encryption_salt) {
            user = { encryption_salt: crypto.randomBytes(24).toString('hex') } as UserModel;
            await userRepo.update({ id: prop.owner_id }, { encryption_salt: user.encryption_salt });
          }
          existing.management_docs_enc = command.management_docs.trim()
            ? this.encryption.encrypt(command.management_docs.trim(), user.encryption_salt)
            : null;
        }
      }

      const saved = await repo.save(existing);
      this.logger.log(`Unit mise à jour: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Erreur update unit: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
