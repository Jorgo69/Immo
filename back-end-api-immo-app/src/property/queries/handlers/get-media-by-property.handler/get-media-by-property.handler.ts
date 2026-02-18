import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetMediaByPropertyQuery } from '../../impl/get-media-by-property.query/get-media-by-property.query';
import { MediaEntity } from '../../../entities/media.entity';

@QueryHandler(GetMediaByPropertyQuery)
export class GetMediaByPropertyHandler implements IQueryHandler<GetMediaByPropertyQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetMediaByPropertyQuery): Promise<MediaEntity[]> {
    return this.dataSource.getRepository(MediaEntity).find({
      where: { property_id: query.property_id },
    });
  }
}
