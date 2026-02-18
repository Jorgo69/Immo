import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { UpdateProfileCommand } from '../../impl/update-profile.command/update-profile.command';
import { ProfileEntity } from '../../../entities/profile.entity';
import { EncryptionService } from '../../../../common/encryption/encryption.service';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<{
    id: string;
    user_id: string;
    full_name: string | null;
    id_card: string | null;
    kyc_status: string;
  }> {
    try {
      const repo = this.dataSource.getRepository(ProfileEntity);
      let profile = await repo.findOne({ where: { user_id: command.userId } });
      if (!profile) {
        profile = repo.create({ user_id: command.userId });
        profile = await repo.save(profile);
      }
      if (command.full_name !== undefined) {
        profile.full_name_enc = command.full_name ? this.encryption.encrypt(command.full_name) : null;
      }
      if (command.id_card !== undefined) {
        profile.id_card_enc = command.id_card ? this.encryption.encrypt(command.id_card) : null;
      }
      profile = await repo.save(profile);
      return {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name_enc && this.encryption.isConfigured()
          ? this.encryption.decrypt(profile.full_name_enc) : null,
        id_card: profile.id_card_enc && this.encryption.isConfigured()
          ? this.encryption.decrypt(profile.id_card_enc) : null,
        kyc_status: profile.kyc_status,
      };
    } catch (error) {
      this.logger.error(`Erreur update profile: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
