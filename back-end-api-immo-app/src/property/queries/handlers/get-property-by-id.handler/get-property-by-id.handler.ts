import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetPropertyByIdQuery } from '../../impl/get-property-by-id.query/get-property-by-id.query';
import { PropertyEntity } from '../../../entities/property.entity';

@QueryHandler(GetPropertyByIdQuery)
export class GetPropertyByIdHandler implements IQueryHandler<GetPropertyByIdQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetPropertyByIdQuery): Promise<PropertyEntity> {
    const property = await this.dataSource.getRepository(PropertyEntity).findOne({
      where: { id: query.id },
      relations: ['media', 'rooms'],
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
