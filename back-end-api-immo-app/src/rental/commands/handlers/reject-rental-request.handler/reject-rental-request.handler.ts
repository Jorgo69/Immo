import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RejectRentalRequestCommand } from '../../impl/reject-rental-request.command/reject-rental-request.command';
import { RentalRequestEntity, RentalRequestStatus } from '../../../entities/rental-request.entity';
import { PropertyEntity } from '../../../../property/entities/property.entity';

@CommandHandler(RejectRentalRequestCommand)
export class RejectRentalRequestHandler implements ICommandHandler<RejectRentalRequestCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: RejectRentalRequestCommand): Promise<RentalRequestEntity> {
    const requestRepo = this.dataSource.getRepository(RentalRequestEntity);
    const propertyRepo = this.dataSource.getRepository(PropertyEntity);

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
      throw new ForbiddenException('Seul le propriétaire peut refuser cette demande.');
    }

    const now = new Date();
    request.status = RentalRequestStatus.REJECTED;
    request.responded_at = now;
    request.responded_by = command.responded_by;
    await requestRepo.save(request);

    return requestRepo.findOne({ where: { id: command.request_id }, relations: ['unit', 'tenant'] }) as Promise<RentalRequestEntity>;
  }
}
