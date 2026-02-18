import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { AddMediaCommand } from '../../impl/add-media.command/add-media.command';
import { MediaEntity } from '../../../entities/media.entity';
import { PropertyEntity } from '../../../entities/property.entity';

@CommandHandler(AddMediaCommand)
export class AddMediaHandler implements ICommandHandler<AddMediaCommand> {
  private readonly logger = new Logger(AddMediaHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: AddMediaCommand): Promise<MediaEntity> {
    try {
      const property = await this.dataSource.getRepository(PropertyEntity).findOne({ where: { id: command.property_id } });
      if (!property) throw new NotFoundException('Property not found');

      const repo = this.dataSource.getRepository(MediaEntity);
      const media = repo.create({ property_id: command.property_id, url: command.url, type: command.type });
      const saved = await repo.save(media);
      this.logger.log(`Media ajouté: ${saved.id} (${command.type})`);
      return saved;
    } catch (error) {
      this.logger.error(`Erreur add media: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
