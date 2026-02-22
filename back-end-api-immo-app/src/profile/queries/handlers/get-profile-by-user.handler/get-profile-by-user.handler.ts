import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetProfileByUserQuery } from '../../impl/get-profile-by-user.query/get-profile-by-user.query';
import { ProfileEntity } from '../../../entities/profile.entity';

/** Réponse sans données sensibles en clair : champs masqués pour affichage (********). */
export interface GetProfileByUserResult {
  id: string;
  user_id: string;
  full_name_masked: string | null;
  id_card_masked: string | null;
  profession_masked: string | null;
  company_masked: string | null;
  emergency_contact_masked: string | null;
  preferred_zone: string | null;
  preferred_zones: string[] | null;
  kyc_status: string;
}

const MASKED_PLACEHOLDER = '********';

@QueryHandler(GetProfileByUserQuery)
export class GetProfileByUserHandler implements IQueryHandler<GetProfileByUserQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetProfileByUserQuery): Promise<GetProfileByUserResult | null> {
    const profile = await this.dataSource.getRepository(ProfileEntity).findOne({
      where: { user_id: query.userId },
    });
    if (!profile) return null;
    return {
      id: profile.id,
      user_id: profile.user_id,
      full_name_masked: profile.full_name_enc ? MASKED_PLACEHOLDER : null,
      id_card_masked: profile.id_card_enc ? MASKED_PLACEHOLDER : null,
      profession_masked: profile.profession_enc ? MASKED_PLACEHOLDER : null,
      company_masked: profile.company_enc ? MASKED_PLACEHOLDER : null,
      emergency_contact_masked: profile.emergency_contact_enc ? MASKED_PLACEHOLDER : null,
      preferred_zone: profile.preferred_zone,
      preferred_zones: profile.preferred_zones ?? (profile.preferred_zone ? [profile.preferred_zone] : null),
      kyc_status: profile.kyc_status,
    };
  }
}
