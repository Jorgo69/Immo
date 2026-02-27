import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateUnitCommand } from '../../impl/update-unit.command/update-unit.command';
import { UnitEntity } from '../../../entities/unit.entity';
import { PropertyEntity } from '../../../entities/property.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';
import { normalizeI18n } from '../../../dto/i18n.dto';
import { normalizeUnitImages } from '../../../dto/unit-image.dto';

/**
 * Met à jour une unité. Gère property_id/owner_id nullable et chiffrement management_docs
 * (owner déduit de property ou de unit.owner_id).
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
      const propertyRepo = this.dataSource.getRepository(PropertyEntity);
      const existing = await repo.findOne({ where: { id: command.id }, relations: ['property'] });
      if (!existing) throw new NotFoundException('Unit not found');

      if (command.requested_by != null) {
        const effectiveOwnerId = existing.property_id
          ? (await propertyRepo.findOne({ where: { id: existing.property_id }, select: { owner_id: true } }))?.owner_id
          : existing.owner_id;
        if (effectiveOwnerId !== command.requested_by) {
          throw new ForbiddenException('Vous ne pouvez modifier que les unités de vos biens.');
        }
      }

      if (command.property_id !== undefined) existing.property_id = command.property_id ?? null;
      if (command.ref_type_id !== undefined) existing.ref_type_id = command.ref_type_id;
      if (command.owner_id !== undefined) existing.owner_id = command.owner_id ?? null;
      if (command.name !== undefined) existing.name = command.name;
      if (command.price !== undefined) existing.price = String(command.price);
      if (command.description !== undefined) {
        existing.description =
          command.description && Object.keys(command.description).length
            ? normalizeI18n(command.description as Record<string, string>)
            : null;
      }
      if (command.features !== undefined) existing.features = command.features;
      if (command.images !== undefined) existing.images = normalizeUnitImages(command.images);
      if (command.unit_status !== undefined) existing.unit_status = command.unit_status;
      if (command.available_from !== undefined) existing.available_from = command.available_from ?? null;
      if (command.address !== undefined) existing.address = command.address ?? null;
      if (command.neighborhood_id !== undefined) existing.neighborhood_id = command.neighborhood_id ?? null;
      if (command.city_id !== undefined) existing.city_id = command.city_id ?? null;
      if (command.gps_latitude !== undefined) existing.gps_latitude = command.gps_latitude ?? null;
      if (command.gps_longitude !== undefined) existing.gps_longitude = command.gps_longitude ?? null;
      if (command.surface_m2 !== undefined) existing.surface_m2 = command.surface_m2;
      if (command.floor !== undefined) existing.floor = command.floor;
      if (command.caution_months !== undefined) existing.caution_months = command.caution_months;
      if (command.avance_months !== undefined) existing.avance_months = command.avance_months;
      if (command.frais_dossier !== undefined)
        existing.frais_dossier = command.frais_dossier != null ? String(command.frais_dossier) : null;
      if (command.prepaid_electricity !== undefined) existing.prepaid_electricity = command.prepaid_electricity;
      if (command.water_included !== undefined) existing.water_included = command.water_included;

      const ownerId = existing.property_id
        ? (await this.dataSource.getRepository(PropertyEntity).findOne({
            where: { id: existing.property_id },
            select: { owner_id: true },
          }))?.owner_id
        : existing.owner_id;

      if (command.management_docs !== undefined && ownerId) {
        const userRepo = this.dataSource.getRepository(UserModel);
        let user = await userRepo.findOne({
          where: { id: ownerId },
          select: ['encryption_salt'],
        });
        if (!user?.encryption_salt) {
          user = { encryption_salt: crypto.randomBytes(24).toString('hex') } as UserModel;
          await userRepo.update({ id: ownerId }, { encryption_salt: user.encryption_salt });
        }
        existing.management_docs_enc = command.management_docs.trim()
          ? this.encryption.encrypt(command.management_docs.trim(), user.encryption_salt)
          : null;
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
