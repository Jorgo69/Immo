import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SignLeaseCommand } from '../../impl/sign-lease.command/sign-lease.command';
import { LeaseEntity, LeaseStatus } from '../../../entities/lease.entity';

@CommandHandler(SignLeaseCommand)
export class SignLeaseCommandHandler implements ICommandHandler<SignLeaseCommand> {
  constructor(
    @InjectRepository(LeaseEntity)
    private readonly leaseRepository: Repository<LeaseEntity>,
  ) {}

  async execute(command: SignLeaseCommand): Promise<LeaseEntity> {
    const { leaseId, userId } = command;

    const lease = await this.leaseRepository.findOne({ where: { id: leaseId } });
    if (!lease) throw new NotFoundException('Bail introuvable');

    if (lease.tenant_id === userId) {
      lease.signed_at_tenant = new Date();
    } else if (lease.landlord_id === userId) {
      lease.signed_at_landlord = new Date();
    } else {
      throw new ForbiddenException('Vous ne faites pas partie de ce contrat de location');
    }

    // Si les deux ont signé, le bail devient ACTIVE
    // Note: Pour simplifier, on pourrait dire que si le locataire signe (après que le bailleur l'ait créé), c'est actif.
    if (lease.signed_at_tenant && lease.signed_at_landlord) {
      lease.status = LeaseStatus.ACTIVE;
      lease.status = LeaseStatus.ACTIVE;
    } else if (lease.signed_at_tenant && lease.status === LeaseStatus.DRAFT) {
        // Optionnel : passer à PENDING_SIGNATURE si un seul a signé
        lease.status = LeaseStatus.PENDING_SIGNATURE;
    }

    // On force ACTIVE si le locataire signe et que c'est le bailleur qui a initié (DRAFT)
    if (lease.signed_at_tenant && lease.status !== LeaseStatus.TERMINATED) {
        lease.status = LeaseStatus.ACTIVE;
    }

    return await this.leaseRepository.save(lease);
  }
}
