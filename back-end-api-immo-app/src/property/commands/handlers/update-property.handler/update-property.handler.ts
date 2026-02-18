import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { UpdatePropertyCommand } from '../../impl/update-property.command/update-property.command';
import { PropertyEntity } from '../../../entities/property.entity';

@CommandHandler(UpdatePropertyCommand)
export class UpdatePropertyHandler implements ICommandHandler<UpdatePropertyCommand> {
  private readonly logger = new Logger(UpdatePropertyHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: UpdatePropertyCommand): Promise<PropertyEntity> {
    try {
      const repo = this.dataSource.getRepository(PropertyEntity);
      const existing = await repo.findOne({ where: { id: command.id } });
      if (!existing) throw new NotFoundException('Property not found');

      if (command.agent_id !== undefined) existing.agent_id = command.agent_id;
      if (command.title !== undefined) existing.title = command.title;
      if (command.title_translations !== undefined) existing.title_translations = command.title_translations;
      if (command.description_translations !== undefined) existing.description_translations = command.description_translations;
      if (command.price_monthly !== undefined) existing.price_monthly = String(command.price_monthly);
      if (command.city !== undefined) existing.city = command.city;
      if (command.district !== undefined) existing.district = command.district;
      if (command.address_details !== undefined) existing.address_details = command.address_details;
      if (command.latitude !== undefined) existing.latitude = String(command.latitude);
      if (command.longitude !== undefined) existing.longitude = String(command.longitude);
      if (command.status !== undefined) existing.status = command.status;
      if (command.available_date !== undefined) existing.available_date = new Date(command.available_date);

      const saved = await repo.save(existing);
      this.logger.log(`Property mise à jour: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Erreur update property: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
