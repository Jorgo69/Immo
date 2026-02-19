/**
 * Get All Users Handler — liste paginée.
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllQuery } from '../../impl/get-all.query/get-all.query';
import { DataSource } from 'typeorm';
import { UserModel } from '../../../../auth/models/user.model/user.model';
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
      .select([
        'u.id',
        'u.phone_number',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.avatar_url',
        'u.is_profile_complete',
        'u.is_verified',
        'u.preferred_lang',
        'u.role',
        'u.is_active',
        'u.created_at',
        'u.updated_at',
      ])
      .orderBy('u.created_at', 'DESC')
      .skip(skip)
      .take(limit);
    if (query.role != null) qb.andWhere('u.role = :role', { role: query.role });
    if (query.is_active != null) qb.andWhere('u.is_active = :is_active', { is_active: query.is_active });
    if (query.search != null && query.search.trim() !== '') {
      qb.andWhere('u.phone_number ILIKE :search', { search: `%${query.search.trim()}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }
}
