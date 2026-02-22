import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeletePropertyCommand } from '../../impl/delete-property.command/delete-property.command';
import { PropertyEntity } from '../../../entities/property.entity';
import { UnitEntity } from '../../../entities/unit.entity';
import { MediaEntity } from '../../../entities/media.entity';

/**
 * Supprime un bien (soft delete) avec cascade sur unités et médias.
 * Vérifie que le demandeur est bien le propriétaire (owner_id).
 */
@CommandHandler(DeletePropertyCommand)
export class DeletePropertyHandler implements ICommandHandler<DeletePropertyCommand> {
  private readonly logger = new Logger(DeletePropertyHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: DeletePropertyCommand): Promise<{ deleted: true }> {
    try {
      const propRepo = this.dataSource.getRepository(PropertyEntity);
      const property = await propRepo.findOne({
        where: { id: command.id },
        select: { id: true, owner_id: true },
      });
      if (!property) throw new NotFoundException('Bien introuvable');
      if (command.owner_id != null && property.owner_id !== command.owner_id) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres biens.');
      }

      await this.dataSource.manager.transaction(async (manager) => {
        const unitRepo = manager.getRepository(UnitEntity);
        const mediaRepo = manager.getRepository(MediaEntity);
        const propRepoTx = manager.getRepository(PropertyEntity);

        await unitRepo.softDelete({ property_id: command.id });
        await mediaRepo.softDelete({ property_id: command.id });
        await propRepoTx.softDelete(command.id);
      });

      this.logger.log(`Bien supprimé (soft): ${command.id}`);
      return { deleted: true };
    } catch (error) {
      this.logger.error(`Erreur delete property: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
