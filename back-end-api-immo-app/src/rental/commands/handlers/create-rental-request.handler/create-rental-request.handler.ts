import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateRentalRequestCommand } from '../../impl/create-rental-request.command/create-rental-request.command';
import { RentalRequestEntity, RentalRequestStatus } from '../../../entities/rental-request.entity';
import { UnitEntity, UnitStatus } from '../../../../property/entities/unit.entity';

/**
 * Crée une demande de location. L'unité doit exister et être disponible.
 */
@CommandHandler(CreateRentalRequestCommand)
export class CreateRentalRequestHandler implements ICommandHandler<CreateRentalRequestCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateRentalRequestCommand): Promise<RentalRequestEntity> {
    const unitRepo = this.dataSource.getRepository(UnitEntity);
    const unit = await unitRepo.findOne({
      where: { id: command.unit_id },
      relations: ['property'],
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.unit_status !== UnitStatus.AVAILABLE) {
      throw new BadRequestException('Cette unité n\'est pas disponible à la location.');
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
