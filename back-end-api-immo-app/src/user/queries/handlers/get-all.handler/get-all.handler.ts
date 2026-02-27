/**
 * Get All Users Handler — liste paginée.
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllQuery } from '../../impl/get-all.query/get-all.query';
import { DataSource } from 'typeorm';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { ProfileEntity } from '../../../../profile/entities/profile.entity';
import { buildPaginatedResult, PaginatedResultDto, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

@QueryHandler(GetAllQuery)
export class GetAllHandler implements IQueryHandler<GetAllQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetAllQuery): Promise<PaginatedResultDto<Partial<UserModel>>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const repo = this.dataSource.getRepository(UserModel);
    const qb = repo
      .createQueryBuilder('u')
      .leftJoinAndMapOne('u.profile', ProfileEntity, 'p', 'p.user_id = u.id')
      .select([
        'u.id',
        'u.phone_number',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.avatar_url',
        'u.is_profile_complete',
        'u.is_verified',
        'u.is_profile_complete',
        'u.preferred_lang',
        'u.role',
        'u.status',
        'u.created_at',
        'u.updated_at',
        'p.id',
        'p.kyc_status',
        'p.kyc_submitted_at',
        'p.kyc_reviewed_at',
      ])
      .orderBy('u.created_at', 'DESC')
      .skip(skip)
      .take(limit);
    if (query.role != null) qb.andWhere('u.role = :role', { role: query.role });
    if (query.status != null) qb.andWhere('u.status = :status', { status: query.status });
    if (query.search != null && query.search.trim() !== '') {
      qb.andWhere('u.phone_number ILIKE :search', { search: `%${query.search.trim()}%` });
    }
    if (query.kycStatus != null) {
      // Pour 'pending' : inclure aussi les profils inexistants (NULL = pending par défaut)
      if (query.kycStatus === 'pending') {
        qb.andWhere('(p.kyc_status = :kycStatus OR p.kyc_status IS NULL)', { kycStatus: query.kycStatus });
      } else {
        qb.andWhere('p.kyc_status = :kycStatus', { kycStatus: query.kycStatus });
      }
    }
    if (query.isVerified != null) {
      qb.andWhere('u.is_verified = :isVerified', { isVerified: query.isVerified });
    }
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }
}
