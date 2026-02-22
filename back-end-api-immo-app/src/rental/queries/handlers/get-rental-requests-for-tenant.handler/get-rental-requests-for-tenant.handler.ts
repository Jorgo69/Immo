import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetRentalRequestsForTenantQuery } from '../../impl/get-rental-requests-for-tenant.query/get-rental-requests-for-tenant.query';
import { RentalRequestEntity } from '../../../entities/rental-request.entity';

@QueryHandler(GetRentalRequestsForTenantQuery)
export class GetRentalRequestsForTenantHandler implements IQueryHandler<GetRentalRequestsForTenantQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetRentalRequestsForTenantQuery): Promise<RentalRequestEntity[]> {
    return this.dataSource.getRepository(RentalRequestEntity).find({
      where: { tenant_id: query.tenant_id },
      relations: ['unit', 'unit.ref_type', 'unit.property', 'unit.city'],
      order: { created_at: 'DESC' },
    });
  }
}
