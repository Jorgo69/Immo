import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeighborhoodEntity } from '../../../entities/neighborhood.entity';
import { GetNeighborhoodsQuery } from '../../impl/get-neighborhoods.query/get-neighborhoods.query';

@QueryHandler(GetNeighborhoodsQuery)
export class GetNeighborhoodsHandler implements IQueryHandler<GetNeighborhoodsQuery> {
  constructor(
    @InjectRepository(NeighborhoodEntity)
    private readonly repo: Repository<NeighborhoodEntity>,
  ) {}

  async execute(query: GetNeighborhoodsQuery): Promise<NeighborhoodEntity[]> {
    const qb = this.repo.createQueryBuilder('n').orderBy('n.name', 'ASC');
    if (query.city_id) {
      qb.where('n.city_id = :cityId', { cityId: query.city_id });
    }
    return qb.getMany();
  }
}
