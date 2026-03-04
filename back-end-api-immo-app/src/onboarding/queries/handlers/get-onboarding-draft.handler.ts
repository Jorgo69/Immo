import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetOnboardingDraftQuery } from '../impl/get-onboarding-draft.query';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { UserModel } from '../../../auth/models/user.model/user.model';
import { ProfileEntity } from '../../../profile/entities/profile.entity';
import { EncryptionService } from '../../../common/encryption/encryption.service';

const ONBOARDING_TTL = 86400 * 7;

@QueryHandler(GetOnboardingDraftQuery)
export class GetOnboardingDraftHandler implements IQueryHandler<GetOnboardingDraftQuery> {
  constructor(
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
  ) {}

  private getRedisKey(userId: string): string {
    return `onboarding:draft:${userId}`;
  }

  async execute(query: GetOnboardingDraftQuery): Promise<any> {
    const { userId } = query;
    const cachedDraft = await this.redisService.get(this.getRedisKey(userId));
    if (cachedDraft) return cachedDraft;

    const user = await this.dataSource.getRepository(UserModel).findOne({
      where: { id: userId },
    });

    if (!user) return {};

    const profile = await this.dataSource.getRepository(ProfileEntity).findOne({
      where: { user_id: userId },
    });

    const salt = user.encryption_salt;
    const decrypt = (val: string | null) => (val && salt ? this.encryptionService.decrypt(val, salt) : val);

    const dbDraft = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      avatar_url: user.avatar_url,
      role: user.role,
      company: decrypt(profile?.company_enc),
      ifu: decrypt(profile?.ifu_enc),
      rccm: decrypt(profile?.rccm_enc),
      preferred_zones: profile?.preferred_zones,
      budget_min: decrypt(profile?.budget_min_enc),
      budget_max: decrypt(profile?.budget_max_enc),
    };

    return Object.fromEntries(Object.entries(dbDraft).filter(([_, v]) => v != null));
  }
}
