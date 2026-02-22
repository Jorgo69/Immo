import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { CreateUnitCommand } from '../../impl/create-unit.command/create-unit.command';
import { UnitEntity } from '../../../entities/unit.entity';
import { PropertyEntity } from '../../../entities/property.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';
import { normalizeI18n } from '../../../dto/i18n.dto';
import { normalizeFeaturesI18n } from '../../../dto/features-i18n.dto';
import { normalizeUnitImages } from '../../../dto/unit-image.dto';

/**
 * Crée une unité (chambre/appartement).
 * - description et features en i18n (fr par défaut). images : url, rank, is_primary, description.
 * - management_docs chiffré via EncryptionService + owner.encryption_salt.
 * - created_by = owner_id du bien (traçabilité) ; peut être surchargé par l'appelant si fourni via contexte.
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
      const propRepo = this.dataSource.getRepository(PropertyEntity);
      const property = await propRepo.findOne({
        where: { id: command.property_id },
        select: { id: true, owner_id: true },
      });
      if (!property) {
        throw new Error('Bien introuvable');
      }
      const userRepo = this.dataSource.getRepository(UserModel);
      const user = await userRepo.findOne({
        where: { id: property.owner_id },
        select: ['id', 'encryption_salt'],
      });
      if (!user) {
        throw new Error('Propriétaire introuvable');
      }
      if (!user.encryption_salt) {
        user.encryption_salt = crypto.randomBytes(24).toString('hex');
        await userRepo.update({ id: property.owner_id }, { encryption_salt: user.encryption_salt });
      }

      let management_docs_enc: string | null = null;
      if (command.management_docs?.trim()) {
        management_docs_enc = this.encryption.encrypt(command.management_docs.trim(), user.encryption_salt);
      }

      const descriptionNorm = command.description ? normalizeI18n(command.description as Record<string, string>) : null;
      const featuresNorm = command.features ? normalizeFeaturesI18n(command.features) : { fr: [], en: [] };
      const imagesNorm = normalizeUnitImages(command.images);

      return await this.dataSource.manager.transaction(async (manager) => {
        const repo = manager.getRepository(UnitEntity);
        const entity = repo.create({
          property_id: command.property_id,
          created_by: property.owner_id,
          name: command.name,
          type: command.type,
          price: String(command.price),
          description: descriptionNorm,
          features: featuresNorm,
          images: imagesNorm,
          management_docs_enc,
          is_available: command.is_available ?? true,
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
