import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetCitiesQuery } from '../../impl/get-cities.query/get-cities.query';
import { CityEntity } from '../../../entities/city.entity';

@QueryHandler(GetCitiesQuery)
export class GetCitiesHandler implements IQueryHandler<GetCitiesQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetCitiesQuery): Promise<CityEntity[]> {
    const qb = this.dataSource.getRepository(CityEntity).createQueryBuilder('c');
    if (query.country_id) {
      qb.andWhere('c.country_id = :country_id', { country_id: query.country_id });
    }
    qb.orderBy('c.name', 'ASC');
    return qb.getMany();
  }
}
