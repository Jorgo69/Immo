import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AddMediaCommand } from '../../impl/add-media.command/add-media.command';
import { MediaEntity } from '../../../entities/media.entity';
import { PropertyEntity } from '../../../entities/property.entity';

@CommandHandler(AddMediaCommand)
export class AddMediaHandler implements ICommandHandler<AddMediaCommand> {
  private readonly logger = new Logger(AddMediaHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: AddMediaCommand): Promise<MediaEntity> {
    try {
      const property = await this.dataSource.getRepository(PropertyEntity).findOne({
        where: { id: command.property_id },
        select: { id: true, owner_id: true },
      });
      if (!property) throw new NotFoundException('Property not found');
      if (command.requested_by != null && property.owner_id !== command.requested_by) {
        throw new ForbiddenException('Vous ne pouvez ajouter des médias qu\'à vos propres biens.');
      }

      const repo = this.dataSource.getRepository(MediaEntity);
      const media = repo.create({
        property_id: command.property_id,
        url: command.url,
        type: command.type,
        rank: command.rank ?? 1,
        is_primary: command.is_primary ?? false,
        description: command.description && typeof command.description === 'object'
          ? (command.description as Record<string, string>)
          : null,
      });
      const saved = await repo.save(media);
      this.logger.log(`Media ajouté: ${saved.id} (${command.type})`);
      return saved as MediaEntity;
    } catch (error) {
      this.logger.error(`Erreur add media: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
