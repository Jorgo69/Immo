/**
 * Get All Users Handler — liste paginée avec tri avancé et filtrage multi-rôles.
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
        'p.completion_score',
      ])
      .skip(skip)
      .take(limit);

    // --- Filtres ---
    if (query.role != null) qb.andWhere('u.role = :role', { role: query.role });

    // Filtrage multi-rôles (ex: "tenant,landlord")
    if (query.roles != null && query.roles.trim() !== '') {
      const roleList = query.roles.split(',').map(r => r.trim()).filter(Boolean);
      if (roleList.length > 0) {
        qb.andWhere('u.role IN (:...roleList)', { roleList });
      }
    }

    if (query.status != null) qb.andWhere('u.status = :status', { status: query.status });
    if (query.search != null && query.search.trim() !== '') {
      qb.andWhere('(u.phone_number ILIKE :search OR u.first_name ILIKE :search OR u.last_name ILIKE :search OR u.email ILIKE :search)',
        { search: `%${query.search.trim()}%` });
    }
    if (query.kycStatus != null) {
      if (query.kycStatus === 'pending') {
        qb.andWhere('(p.kyc_status = :kycStatus OR p.kyc_status IS NULL)', { kycStatus: query.kycStatus });
      } else {
        qb.andWhere('p.kyc_status = :kycStatus', { kycStatus: query.kycStatus });
      }
    }
    if (query.isVerified != null) {
      qb.andWhere('u.is_verified = :isVerified', { isVerified: query.isVerified });
    }

    // --- Tri ---
    const sortField = query.sortBy ?? 'created_at';
    const sortOrder = query.sortOrder ?? 'DESC';

    if (sortField === 'completion_score') {
      qb.orderBy('p.completion_score', sortOrder);
      qb.addOrderBy('u.created_at', 'DESC'); // Tri secondaire
    } else {
      qb.orderBy('u.created_at', sortOrder);
    }

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }
}
