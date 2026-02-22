import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetPropertiesByOwnerQuery } from '../../impl/get-properties-by-owner.query/get-properties-by-owner.query';
import { PropertyEntity } from '../../../entities/property.entity';
import { UnitEntity } from '../../../entities/unit.entity';
import {
  buildPaginatedResult,
  PaginatedResultDto,
  PAGINATION_MAX_LIMIT,
} from '../../../../common/dto/pagination.dto';

/** Biens virtuels : unités standalone (property_id = null) exposées comme un bien pour la liste. */
export type VirtualPropertyListItem = PropertyEntity & { _virtual?: boolean };

/**
 * Retourne les biens immobiliers + unités standalone (property_id = null) du propriétaire.
 * Les unités indépendantes apparaissent comme des « biens virtuels » (une entrée par unité).
 */
@QueryHandler(GetPropertiesByOwnerQuery)
export class GetPropertiesByOwnerHandler implements IQueryHandler<GetPropertiesByOwnerQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetPropertiesByOwnerQuery): Promise<PaginatedResultDto<PropertyEntity | VirtualPropertyListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const propRepo = this.dataSource.getRepository(PropertyEntity);
    const unitRepo = this.dataSource.getRepository(UnitEntity);

    const qb = propRepo.createQueryBuilder('p');
    qb.leftJoinAndSelect('p.media', 'media');
    qb.leftJoinAndSelect('p.units', 'units');
    qb.leftJoinAndSelect('units.ref_type', 'unit_ref_type');
    qb.leftJoin('p.city', 'city');
    qb.andWhere('p.owner_id = :owner_id', { owner_id: query.owner_id });
    if (query.city) qb.andWhere('city.name = :city', { city: query.city });
    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.min_price != null) {
      qb.andWhere('EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id AND (u.deleted_at IS NULL) AND u.price >= :min_price)', { min_price: String(query.min_price) });
    }
    if (query.max_price != null) {
      qb.andWhere('EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id AND (u.deleted_at IS NULL) AND u.price <= :max_price)', { max_price: String(query.max_price) });
    }
    qb.orderBy('p.created_at', 'DESC');

    const [properties, totalProperties] = await qb.getManyAndCount();

    const unitQb = unitRepo.createQueryBuilder('u');
    unitQb.leftJoinAndSelect('u.ref_type', 'ref_type');
    unitQb.leftJoinAndSelect('u.city', 'city');
    unitQb.andWhere('u.property_id IS NULL');
    unitQb.andWhere('u.owner_id = :owner_id', { owner_id: query.owner_id });
    unitQb.andWhere('u.deleted_at IS NULL');
    if (query.min_price != null) unitQb.andWhere('u.price >= :min_price', { min_price: String(query.min_price) });
    if (query.max_price != null) unitQb.andWhere('u.price <= :max_price', { max_price: String(query.max_price) });
    unitQb.orderBy('u.created_at', 'DESC');

    const standaloneUnits = await unitQb.getMany();

    const virtualItems: VirtualPropertyListItem[] = standaloneUnits.map((unit) => {
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
      } as VirtualPropertyListItem;
    });

    const combined: (PropertyEntity | VirtualPropertyListItem)[] = [
      ...properties,
      ...virtualItems,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = combined.length;
    const data = combined.slice(skip, skip + limit);
    return buildPaginatedResult(data, total, page, limit);
  }
}
