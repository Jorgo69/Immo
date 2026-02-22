import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetCountriesQuery } from '../../impl/get-countries.query/get-countries.query';
import { CountryEntity } from '../../../entities/country.entity';

@QueryHandler(GetCountriesQuery)
export class GetCountriesHandler implements IQueryHandler<GetCountriesQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(_query: GetCountriesQuery): Promise<CountryEntity[]> {
    return this.dataSource.getRepository(CountryEntity).find({
      order: { name: 'ASC' },
    });
  }
}
