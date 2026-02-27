import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetPropertyByIdQuery } from '../../impl/get-property-by-id.query/get-property-by-id.query';
import { PropertyEntity } from '../../../entities/property.entity';
import { UnitEntity } from '../../../entities/unit.entity';

/** Détail d'un bien ou d'une unité standalone (exposé comme bien virtuel). */
export type PropertyDetailResult = PropertyEntity | (PropertyEntity & { _virtual?: boolean; units: UnitEntity[] });

@QueryHandler(GetPropertyByIdQuery)
export class GetPropertyByIdHandler implements IQueryHandler<GetPropertyByIdQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetPropertyByIdQuery): Promise<PropertyDetailResult> {
    const property = await this.dataSource.getRepository(PropertyEntity).findOne({
      where: { id: query.id },
      relations: ['media', 'units', 'units.ref_type', 'city', 'neighborhood', 'units.neighborhood'],
    });
    if (property) return property;

    const unit = await this.dataSource.getRepository(UnitEntity).findOne({
      where: { id: query.id, property_id: null },
      relations: ['ref_type', 'city', 'neighborhood'],
    });
    if (!unit) throw new NotFoundException('Property not found');

    const mainImage = unit.images?.[0]?.url ?? null;
    return {
      id: unit.id,
      name: unit.name,
      status: 'available',
      owner_id: unit.owner_id!,
      agent_id: null,
      created_by: unit.created_by,
      building_type: 'villa',
      address: unit.address ?? '',
      city_id: unit.city_id,
      city: unit.city,
      neighborhood_id: unit.neighborhood_id,
      neighborhood: unit.neighborhood,
      gps_latitude: unit.gps_latitude,
      gps_longitude: unit.gps_longitude,
      main_image: mainImage,
      gallery: [],
      description: unit.description,
      media: [],
      units: [unit],
      created_at: unit.created_at,
      updated_at: unit.updated_at,
      deleted_at: null,
      title_deed_enc: null,
      _virtual: true,
    } as PropertyDetailResult;
  }
}
