import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { CreateUnitCommand } from '../../impl/create-unit.command/create-unit.command';
import { UnitEntity, UnitStatus } from '../../../entities/unit.entity';
import { PropertyEntity } from '../../../entities/property.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';
import { normalizeI18n } from '../../../dto/i18n.dto';
import { normalizeUnitImages } from '../../../dto/unit-image.dto';

/**
 * Crée une unité (ressource transactionnelle).
 * - Si property_id est fourni : owner déduit du bien, created_by = owner.
 * - Si property_id est null : owner_id obligatoire (unité autonome).
 * - features = tableau de codes ref_feature (string[]).
 * - unit_status = NOTICE_GIVEN exige available_from (contrôle métier à renforcer en validation).
 */
@CommandHandler(CreateUnitCommand)
export class CreateUnitHandler implements ICommandHandler<CreateUnitCommand> {
  private readonly logger = new Logger(CreateUnitHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(command: CreateUnitCommand): Promise<UnitEntity> {
    try {
      let ownerId: string | null = null;

      if (command.property_id) {
        const propRepo = this.dataSource.getRepository(PropertyEntity);
        const property = await propRepo.findOne({
          where: { id: command.property_id },
          select: { id: true, owner_id: true },
        });
        if (!property) throw new Error('Bien introuvable');
        ownerId = property.owner_id;
      } else {
        if (!command.owner_id) throw new Error('owner_id obligatoire lorsque property_id est null');
        ownerId = command.owner_id;
      }

      const userRepo = this.dataSource.getRepository(UserModel);
      const user = await userRepo.findOne({
        where: { id: ownerId },
        select: ['id', 'encryption_salt'],
      });
      if (!user) throw new Error('Propriétaire introuvable');
      if (!user.encryption_salt) {
        user.encryption_salt = crypto.randomBytes(24).toString('hex');
        await userRepo.update({ id: ownerId }, { encryption_salt: user.encryption_salt });
      }

      let management_docs_enc: string | null = null;
      if (command.management_docs?.trim()) {
        management_docs_enc = this.encryption.encrypt(command.management_docs.trim(), user.encryption_salt);
      }

      const descriptionNorm = command.description ? normalizeI18n(command.description as Record<string, string>) : null;
      const featuresNorm = Array.isArray(command.features) ? command.features : [];
      const imagesNorm = normalizeUnitImages(command.images);

      return await this.dataSource.manager.transaction(async (manager) => {
        const repo = manager.getRepository(UnitEntity);
        const entity = repo.create({
          property_id: command.property_id ?? null,
          owner_id: command.property_id ? null : command.owner_id ?? null,
          ref_type_id: command.ref_type_id,
          created_by: ownerId,
          name: command.name,
          price: String(command.price),
          description: descriptionNorm,
          features: featuresNorm,
          images: imagesNorm,
          management_docs_enc,
          unit_status: command.unit_status ?? UnitStatus.AVAILABLE,
          available_from: command.available_from ?? null,
          address: command.address ?? null,
          city_id: command.city_id ?? null,
          gps_latitude: command.gps_latitude ?? null,
          gps_longitude: command.gps_longitude ?? null,
          surface_m2: command.surface_m2 ?? null,
          floor: command.floor ?? null,
          caution_months: command.caution_months ?? null,
          avance_months: command.avance_months ?? null,
          frais_dossier: command.frais_dossier != null ? String(command.frais_dossier) : null,
          prepaid_electricity: command.prepaid_electricity ?? false,
          water_included: command.water_included ?? false,
        });
        const saved = await repo.save(entity);
        this.logger.log(`Unit créée: ${saved.id}`);
        return saved;
      });
    } catch (error) {
      this.logger.error(`Erreur create unit: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
