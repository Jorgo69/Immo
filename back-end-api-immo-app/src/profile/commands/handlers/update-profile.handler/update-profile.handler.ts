import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UpdateProfileCommand } from '../../impl/update-profile.command/update-profile.command';
import { ProfileEntity } from '../../../entities/profile.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';
import { GetProfileByUserResult } from '../../../queries/handlers/get-profile-by-user.handler/get-profile-by-user.handler';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<GetProfileByUserResult> {
    try {
      const userRepo = this.dataSource.getRepository(UserModel);
      const profileRepo = this.dataSource.getRepository(ProfileEntity);

      let user = await userRepo.findOne({ where: { id: command.userId }, select: ['id', 'encryption_salt'] });
      if (!user) throw new ForbiddenException('Utilisateur introuvable');
      if (!user.encryption_salt) {
        user.encryption_salt = crypto.randomBytes(24).toString('hex');
        await userRepo.update({ id: command.userId }, { encryption_salt: user.encryption_salt });
      }

      return await this.dataSource.manager.transaction(async (manager) => {
        const pRepo = manager.getRepository(ProfileEntity);
        let profile = await pRepo.findOne({ where: { user_id: command.userId } });
        if (!profile) {
          profile = pRepo.create({ user_id: command.userId });
          profile = await pRepo.save(profile);
        }
        if (profile.user_id !== command.userId) {
          throw new ForbiddenException('Seul le propriétaire du profil peut le modifier');
        }
        if (command.full_name !== undefined) {
          profile.full_name_enc = command.full_name
            ? this.encryption.encrypt(command.full_name, user.encryption_salt)
            : null;
        }
        if (command.id_card !== undefined) {
          profile.id_card_enc = command.id_card
            ? this.encryption.encrypt(command.id_card, user.encryption_salt)
            : null;
        }
        if (command.profession !== undefined) {
          profile.profession_enc = command.profession
            ? this.encryption.encrypt(command.profession, user.encryption_salt)
            : null;
        }
        if (command.company !== undefined) {
          profile.company_enc = command.company
            ? this.encryption.encrypt(command.company, user.encryption_salt)
            : null;
        }
        if (command.emergency_contact !== undefined) {
          profile.emergency_contact_enc = command.emergency_contact
            ? this.encryption.encrypt(command.emergency_contact, user.encryption_salt)
            : null;
        }
        if (command.preferred_zone !== undefined) {
          profile.preferred_zone = command.preferred_zone?.trim() || null;
        }
        if (command.budget_min !== undefined) {
          profile.budget_min_enc = command.budget_min
            ? this.encryption.encrypt(command.budget_min, user.encryption_salt)
            : null;
        }
        if (command.budget_max !== undefined) {
          profile.budget_max_enc = command.budget_max
            ? this.encryption.encrypt(command.budget_max, user.encryption_salt)
            : null;
        }
        profile = await pRepo.save(profile);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name_masked: profile.full_name_enc ? '********' : null,
          id_card_masked: profile.id_card_enc ? '********' : null,
          profession_masked: profile.profession_enc ? '********' : null,
          company_masked: profile.company_enc ? '********' : null,
          emergency_contact_masked: profile.emergency_contact_enc ? '********' : null,
          preferred_zone: profile.preferred_zone,
          kyc_status: profile.kyc_status,
        };
      });
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(`Erreur update profile: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
