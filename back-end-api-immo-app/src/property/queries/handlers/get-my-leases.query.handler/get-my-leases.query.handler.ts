import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetMyLeasesQuery } from '../../impl/get-my-leases.query/get-my-leases.query';
import { LeaseEntity } from '../../../entities/lease.entity';

@QueryHandler(GetMyLeasesQuery)
export class GetMyLeasesQueryHandler implements IQueryHandler<GetMyLeasesQuery> {
  constructor(
    @InjectRepository(LeaseEntity)
    private readonly leaseRepository: Repository<LeaseEntity>,
  ) {}

  async execute(query: GetMyLeasesQuery): Promise<LeaseEntity[]> {
    const { userId } = query;

    return await this.leaseRepository.find({
      where: [
        { tenant_id: userId },
        { landlord_id: userId },
      ],
      relations: ['property', 'unit', 'tenant', 'landlord', 'invoices'],
      order: { created_at: 'DESC' },
    });
  }
}
