import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteUnitCommand } from '../../impl/delete-unit.command/delete-unit.command';
import { UnitEntity } from '../../../entities/unit.entity';
import { PropertyEntity } from '../../../entities/property.entity';

/**
 * Supprime une unité (soft delete).
 * Vérifie que l'unité appartient au bien et que le demandeur est le propriétaire.
 */
@CommandHandler(DeleteUnitCommand)
export class DeleteUnitHandler implements ICommandHandler<DeleteUnitCommand> {
  private readonly logger = new Logger(DeleteUnitHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: DeleteUnitCommand): Promise<{ deleted: true }> {
    try {
      const unitRepo = this.dataSource.getRepository(UnitEntity);
      const unit = await unitRepo.findOne({
        where: { id: command.id },
        select: { id: true, property_id: true },
      });
      if (!unit) throw new NotFoundException('Unité introuvable');
      if (unit.property_id !== command.property_id) {
        throw new ForbiddenException('Unité non rattachée à ce bien.');
      }

      if (command.owner_id != null) {
        const propRepo = this.dataSource.getRepository(PropertyEntity);
        const property = await propRepo.findOne({
          where: { id: command.property_id },
          select: { owner_id: true },
        });
        if (!property || property.owner_id !== command.owner_id) {
          throw new ForbiddenException('Vous ne pouvez supprimer que les unités de vos biens.');
        }
      }

      await unitRepo.softDelete(command.id);
      this.logger.log(`Unité supprimée (soft): ${command.id}`);
      return { deleted: true };
    } catch (error) {
      this.logger.error(`Erreur delete unit: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
