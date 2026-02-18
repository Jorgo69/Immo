import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { SearchPropertiesQuery } from '../../impl/search-properties.query/search-properties.query';
import { PropertyEntity } from '../../../entities/property.entity';
import { buildPaginatedResult, PaginatedResultDto, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

@QueryHandler(SearchPropertiesQuery)
export class SearchPropertiesHandler implements IQueryHandler<SearchPropertiesQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: SearchPropertiesQuery): Promise<PaginatedResultDto<PropertyEntity>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = this.dataSource.getRepository(PropertyEntity).createQueryBuilder('p');
    qb.leftJoinAndSelect('p.media', 'media');
    if (query.q?.trim()) {
      const term = `%${query.q.trim().replace(/%/g, '\\%')}%`;
      qb.andWhere(
        '(p.title ILIKE :term OR p.city ILIKE :term OR p.district ILIKE :term OR CAST(p.description_translations AS TEXT) ILIKE :term OR CAST(p.title_translations AS TEXT) ILIKE :term)',
        { term },
      );
    }
    if (query.city) qb.andWhere('p.city = :city', { city: query.city });
    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.min_price != null) qb.andWhere('p.price_monthly >= :min_price', { min_price: String(query.min_price) });
    if (query.max_price != null) qb.andWhere('p.price_monthly <= :max_price', { max_price: String(query.max_price) });
    qb.orderBy('p.created_at', 'DESC');

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }
}
