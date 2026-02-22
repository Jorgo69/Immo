import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateRentalRequestCommand } from '../../impl/create-rental-request.command/create-rental-request.command';
import { RentalRequestEntity, RentalRequestStatus } from '../../../entities/rental-request.entity';
import { UnitEntity, UnitStatus } from '../../../../property/entities/unit.entity';
import { PropertyEntity } from '../../../../property/entities/property.entity';

/**
 * Crée une demande de location. L'unité doit exister et être disponible.
 * Règle stricte : un utilisateur ne peut pas créer une demande pour son propre bien.
 */
@CommandHandler(CreateRentalRequestCommand)
export class CreateRentalRequestHandler implements ICommandHandler<CreateRentalRequestCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateRentalRequestCommand): Promise<RentalRequestEntity> {
    const unitRepo = this.dataSource.getRepository(UnitEntity);
    const propertyRepo = this.dataSource.getRepository(PropertyEntity);
    const unit = await unitRepo.findOne({
      where: { id: command.unit_id },
      relations: ['property'],
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.unit_status !== UnitStatus.AVAILABLE) {
      throw new BadRequestException('Cette unité n\'est pas disponible à la location.');
    }

    const ownerId = unit.property_id
      ? (await propertyRepo.findOne({ where: { id: unit.property_id }, select: { owner_id: true } }))?.owner_id
      : unit.owner_id;
    if (ownerId && ownerId === command.tenant_id) {
      throw new ForbiddenException('Vous ne pouvez pas créer une demande de location pour votre propre bien.');
    }

    const repo = this.dataSource.getRepository(RentalRequestEntity);
    const existing = await repo.findOne({
      where: { unit_id: command.unit_id, tenant_id: command.tenant_id, status: RentalRequestStatus.PENDING },
    });
    if (existing) throw new BadRequestException('Vous avez déjà une demande en attente pour cette unité.');

    const entity = repo.create({
      unit_id: command.unit_id,
      tenant_id: command.tenant_id,
      message: command.message?.trim() || null,
      desired_move_in_at: command.desired_move_in_at?.trim() || null,
      status: RentalRequestStatus.PENDING,
    });
    return repo.save(entity);
  }
}
