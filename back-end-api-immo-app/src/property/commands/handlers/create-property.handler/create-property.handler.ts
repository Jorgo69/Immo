import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CreatePropertyCommand } from '../../impl/create-property.command/create-property.command';
import { PropertyEntity, PropertyStatus } from '../../../entities/property.entity';

@CommandHandler(CreatePropertyCommand)
export class CreatePropertyHandler implements ICommandHandler<CreatePropertyCommand> {
  private readonly logger = new Logger(CreatePropertyHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreatePropertyCommand): Promise<PropertyEntity> {
    try {
      const repo = this.dataSource.getRepository(PropertyEntity);
      const entity = repo.create({
        owner_id: command.owner_id,
        agent_id: command.agent_id ?? null,
        title: command.title,
        title_translations: command.title_translations ?? null,
        description_translations: command.description_translations ?? null,
        price_monthly: String(command.price_monthly),
        city: command.city,
        district: command.district ?? null,
        address_details: command.address_details ?? null,
        latitude: command.latitude != null ? String(command.latitude) : null,
        longitude: command.longitude != null ? String(command.longitude) : null,
        status: command.status ?? PropertyStatus.AVAILABLE,
        available_date: command.available_date ? new Date(command.available_date) : null,
      });
      const saved = await repo.save(entity);
      this.logger.log(`Property créée: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Erreur create property: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
