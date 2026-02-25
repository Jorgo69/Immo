import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { SearchPropertiesQuery } from '../../impl/search-properties.query/search-properties.query';
import { PropertyEntity } from '../../../entities/property.entity';
import { UnitEntity } from '../../../entities/unit.entity';
import { buildPaginatedResult, PaginatedResultDto, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

type VirtualListItem = PropertyEntity & { _virtual?: boolean };

/**
 * Recherche : biens + unités standalone (property_id = null), exposés comme biens virtuels.
 */
@QueryHandler(SearchPropertiesQuery)
export class SearchPropertiesHandler implements IQueryHandler<SearchPropertiesQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: SearchPropertiesQuery): Promise<PaginatedResultDto<PropertyEntity | VirtualListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const propRepo = this.dataSource.getRepository(PropertyEntity);
    const unitRepo = this.dataSource.getRepository(UnitEntity);

    const qb = propRepo.createQueryBuilder('p');
    qb.leftJoinAndSelect('p.media', 'media');
    qb.leftJoinAndSelect('p.units', 'units');
    qb.leftJoin('p.city', 'city');
    if (query.q?.trim()) {
      const term = `%${query.q.trim().replace(/%/g, '\\%')}%`;
      qb.andWhere(
        '(p.name ILIKE :term OR p.address ILIKE :term OR city.name ILIKE :term)',
        { term },
      );
    }
    if (query.city) qb.andWhere('city.name = :city', { city: query.city });
    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.building_type) qb.andWhere('p.building_type = :building_type', { building_type: query.building_type });
    if (query.unit_type_id) {
      qb.andWhere('EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id AND (u.deleted_at IS NULL) AND u.ref_type_id = :unit_type_id)', { unit_type_id: query.unit_type_id });
    }
    if (query.min_price != null) {
      qb.andWhere('EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id AND (u.deleted_at IS NULL) AND u.price >= :min_price)', { min_price: String(query.min_price) });
    }
    if (query.max_price != null) {
      qb.andWhere('EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id AND (u.deleted_at IS NULL) AND u.price <= :max_price)', { max_price: String(query.max_price) });
    }
    qb.orderBy('p.created_at', 'DESC');

    const properties = await qb.getMany();

    const unitQb = unitRepo.createQueryBuilder('u');
    unitQb.leftJoinAndSelect('u.ref_type', 'ref_type');
    unitQb.leftJoinAndSelect('u.city', 'city');
    unitQb.andWhere('u.property_id IS NULL');
    unitQb.andWhere('u.deleted_at IS NULL');
    if (query.q?.trim()) {
      const term = `%${query.q.trim().replace(/%/g, '\\%')}%`;
      unitQb.andWhere(
        '(u.name ILIKE :term OR u.address ILIKE :term OR city.name ILIKE :term)',
        { term },
      );
    }
    if (query.city) unitQb.andWhere('city.name = :city', { city: query.city });
    if (query.unit_type_id) unitQb.andWhere('u.ref_type_id = :unit_type_id', { unit_type_id: query.unit_type_id });
    if (query.min_price != null) unitQb.andWhere('u.price >= :min_price', { min_price: String(query.min_price) });
    if (query.max_price != null) unitQb.andWhere('u.price <= :max_price', { max_price: String(query.max_price) });
    unitQb.orderBy('u.created_at', 'DESC');

    let standaloneUnits = await unitQb.getMany();

    // Filtre building_type pour les unités virtuelles (elles sont toutes considérées comme des 'villa' par défaut pour l'instant)
    if (query.building_type && query.building_type.toLowerCase() !== 'villa') {
      standaloneUnits = [];
    }

    const virtualItems: VirtualListItem[] = standaloneUnits.map((unit) => {
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
      } as VirtualListItem;
    });

    const combined: (PropertyEntity | VirtualListItem)[] = [
      ...properties,
      ...virtualItems,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = combined.length;
    const data = combined.slice(skip, skip + limit);
    return buildPaginatedResult(data, total, page, limit);
  }
}
