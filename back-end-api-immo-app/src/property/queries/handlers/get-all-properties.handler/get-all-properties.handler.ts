import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetAllPropertiesQuery } from '../../impl/get-all-properties.query/get-all-properties.query';
import { PropertyEntity } from '../../../entities/property.entity';
import { buildPaginatedResult, PaginatedResultDto, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

@QueryHandler(GetAllPropertiesQuery)
export class GetAllPropertiesHandler implements IQueryHandler<GetAllPropertiesQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetAllPropertiesQuery): Promise<PaginatedResultDto<PropertyEntity>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = this.dataSource.getRepository(PropertyEntity).createQueryBuilder('p');
    qb.leftJoinAndSelect('p.media', 'media');
    qb.leftJoinAndSelect('p.units', 'units');
    qb.leftJoinAndSelect('p.city', 'city');
    qb.leftJoinAndSelect('p.neighborhood', 'neighborhood');
    if (query.city) qb.andWhere('city.name = :city', { city: query.city });
    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.min_price != null) {
      qb.andWhere('EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id AND (u.deleted_at IS NULL) AND u.price >= :min_price)', { min_price: String(query.min_price) });
    }
    if (query.max_price != null) {
      qb.andWhere('EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id AND (u.deleted_at IS NULL) AND u.price <= :max_price)', { max_price: String(query.max_price) });
    }
    qb.orderBy('p.created_at', 'DESC');

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }
}
