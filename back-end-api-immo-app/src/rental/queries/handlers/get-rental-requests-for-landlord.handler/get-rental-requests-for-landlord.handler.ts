import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetRentalRequestsForLandlordQuery } from '../../impl/get-rental-requests-for-landlord.query/get-rental-requests-for-landlord.query';
import { RentalRequestEntity } from '../../../entities/rental-request.entity';
import { PropertyEntity } from '../../../../property/entities/property.entity';
import { UnitEntity } from '../../../../property/entities/unit.entity';

/**
 * Retourne les demandes de location pour les unités dont le propriétaire est owner (property ou unit.owner_id).
 */
@QueryHandler(GetRentalRequestsForLandlordQuery)
export class GetRentalRequestsForLandlordHandler implements IQueryHandler<GetRentalRequestsForLandlordQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetRentalRequestsForLandlordQuery): Promise<RentalRequestEntity[]> {
    const repo = this.dataSource.getRepository(RentalRequestEntity);
    const qb = repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.unit', 'unit')
      .leftJoinAndSelect('unit.ref_type', 'unit_ref_type')
      .leftJoinAndSelect('unit.property', 'unit_property')
      .leftJoinAndSelect('r.tenant', 'tenant')
      .where(
        `(unit.property_id IS NOT NULL AND unit_property.owner_id = :landlord_id) OR (unit.property_id IS NULL AND unit.owner_id = :landlord_id)`,
        { landlord_id: query.landlord_id },
      )
      .orderBy('r.created_at', 'DESC');
    return qb.getMany();
  }
}
