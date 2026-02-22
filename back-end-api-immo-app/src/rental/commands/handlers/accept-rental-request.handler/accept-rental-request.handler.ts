import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AcceptRentalRequestCommand } from '../../impl/accept-rental-request.command/accept-rental-request.command';
import { RentalRequestEntity, RentalRequestStatus } from '../../../entities/rental-request.entity';
import { UnitEntity, UnitStatus } from '../../../../property/entities/unit.entity';
import { PropertyEntity } from '../../../../property/entities/property.entity';

/**
 * Accepte la demande : unit → OCCUPIED, autres demandes pour la même unité → REJECTED.
 */
@CommandHandler(AcceptRentalRequestCommand)
export class AcceptRentalRequestHandler implements ICommandHandler<AcceptRentalRequestCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: AcceptRentalRequestCommand): Promise<RentalRequestEntity> {
    return await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(RentalRequestEntity);
      const unitRepo = manager.getRepository(UnitEntity);
      const propertyRepo = manager.getRepository(PropertyEntity);

      const request = await requestRepo.findOne({
        where: { id: command.request_id },
        relations: ['unit', 'unit.property'],
      });
      if (!request) throw new NotFoundException('Demande non trouvée');
      if (request.status !== RentalRequestStatus.PENDING) {
        throw new ForbiddenException('Cette demande a déjà été traitée.');
      }

      const unit = request.unit;
      const ownerId = unit.property_id
        ? (await propertyRepo.findOne({ where: { id: unit.property_id }, select: { owner_id: true } }))?.owner_id
        : unit.owner_id;
      if (ownerId !== command.responded_by) {
        throw new ForbiddenException('Seul le propriétaire peut accepter cette demande.');
      }

      const now = new Date();
      request.status = RentalRequestStatus.ACCEPTED;
      request.responded_at = now;
      request.responded_by = command.responded_by;
      await requestRepo.save(request);

      await unitRepo.update({ id: unit.id }, { unit_status: UnitStatus.OCCUPIED });

      await requestRepo.update(
        { unit_id: unit.id, status: RentalRequestStatus.PENDING },
        { status: RentalRequestStatus.REJECTED, responded_at: now, responded_by: command.responded_by },
      );

      return requestRepo.findOne({ where: { id: command.request_id }, relations: ['unit', 'tenant'] }) as Promise<RentalRequestEntity>;
    });
  }
}
