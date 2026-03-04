import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateLeaseCommand } from '../../impl/create-lease.command/create-lease.command';
import { LeaseEntity, LeaseStatus } from '../../../entities/lease.entity';
import { PropertyEntity } from '../../../entities/property.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { UnitEntity } from '../../../entities/unit.entity';

@CommandHandler(CreateLeaseCommand)
export class CreateLeaseCommandHandler implements ICommandHandler<CreateLeaseCommand> {
  constructor(
    @InjectRepository(LeaseEntity)
    private readonly leaseRepository: Repository<LeaseEntity>,
    @InjectRepository(PropertyEntity)
    private readonly propertyRepository: Repository<PropertyEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async execute(command: CreateLeaseCommand): Promise<LeaseEntity> {
    const { 
      landlordId, tenantId, propertyId, unitId, 
      monthlyRent, depositAmount, startDate, endDate,
      contractType, contractContent 
    } = command;

    // 1. Vérifier le bailleur et le propriétaire du bien
    const property = await this.propertyRepository.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Bien immobilier introuvable');
    
    // Si l'utilisateur n'est pas Admin, il doit être le proprio du bien
    // TODO: vérifier le rôle via context, ici on se base sur landlord_id
    if (property.owner_id !== landlordId) {
      throw new ForbiddenException('Vous n\'êtes pas le propriétaire de ce bien');
    }

    // 2. Vérifier le locataire
    const tenant = await this.userRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Locataire introuvable');

    // 3. CONFORMITÉ BÉNIN : Caution <= 3 mois de loyer (Loi 2022-30)
    const maxDeposit = monthlyRent * 3;
    if (depositAmount > maxDeposit) {
      throw new BadRequestException(
        `Conformité Bénin (Loi 2022-30) : Le dépôt de garantie ne peut excéder 3 mois de loyer (${maxDeposit} FCFA).`
      );
    }

    // 4. Créer le bail en mode DRAFT
    const lease = this.leaseRepository.create({
      landlord_id: landlordId,
      tenant_id: tenantId,
      property_id: propertyId,
      unit_id: unitId,
      monthly_rent: monthlyRent,
      deposit_amount: depositAmount,
      start_date: new Date(startDate),
      end_date: endDate ? new Date(endDate) : null,
      contract_type: contractType,
      contract_content: contractContent,
      status: LeaseStatus.DRAFT,
      next_billing_date: new Date(startDate), // Premier loyer à la date de début
    });

    return await this.leaseRepository.save(lease);
  }
}
