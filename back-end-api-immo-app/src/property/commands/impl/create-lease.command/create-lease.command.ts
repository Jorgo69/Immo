import { ContractType } from '../../../entities/lease.entity';

export class CreateLeaseCommand {
  constructor(
    public readonly landlordId: string,
    public readonly tenantId: string,
    public readonly propertyId: string,
    public readonly unitId: string | null,
    public readonly monthlyRent: number,
    public readonly depositAmount: number,
    public readonly startDate: string,
    public readonly endDate: string | null,
    public readonly contractType: ContractType = ContractType.STANDARD,
    public readonly contractContent: string | null = null,
  ) {}
}
