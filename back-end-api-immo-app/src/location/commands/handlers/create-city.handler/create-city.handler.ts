import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CreateCityCommand } from '../../impl/create-city.command/create-city.command';
import { CityEntity } from '../../../entities/city.entity';

@CommandHandler(CreateCityCommand)
export class CreateCityHandler implements ICommandHandler<CreateCityCommand> {
  private readonly logger = new Logger(CreateCityHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateCityCommand): Promise<CityEntity> {
    try {
      const repo = this.dataSource.getRepository(CityEntity);
      const entity = repo.create({ country_id: command.country_id, name: command.name });
      const saved = await repo.save(entity);
      this.logger.log(`Ville créée: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Erreur create city: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
