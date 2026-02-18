import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetProfileByUserQuery } from '../../impl/get-profile-by-user.query/get-profile-by-user.query';
import { ProfileEntity } from '../../../entities/profile.entity';
import { EncryptionService } from '../../../../common/encryption/encryption.service';

@QueryHandler(GetProfileByUserQuery)
export class GetProfileByUserHandler implements IQueryHandler<GetProfileByUserQuery> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(query: GetProfileByUserQuery): Promise<{
    id: string;
    user_id: string;
    full_name: string | null;
    id_card: string | null;
    kyc_status: string;
  } | null> {
    const profile = await this.dataSource.getRepository(ProfileEntity).findOne({
      where: { user_id: query.userId },
    });
    if (!profile) return null;
    return {
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name_enc && this.encryption.isConfigured()
        ? this.encryption.decrypt(profile.full_name_enc) : null,
      id_card: profile.id_card_enc && this.encryption.isConfigured()
        ? this.encryption.decrypt(profile.id_card_enc) : null,
      kyc_status: profile.kyc_status,
    };
  }
}
