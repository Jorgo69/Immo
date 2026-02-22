import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CreateCountryCommand } from '../../impl/create-country.command/create-country.command';
import { CountryEntity } from '../../../entities/country.entity';

@CommandHandler(CreateCountryCommand)
export class CreateCountryHandler implements ICommandHandler<CreateCountryCommand> {
  private readonly logger = new Logger(CreateCountryHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateCountryCommand): Promise<CountryEntity> {
    try {
      const repo = this.dataSource.getRepository(CountryEntity);
      const entity = repo.create({ name: command.name, iso_code: command.iso_code.toUpperCase() });
      const saved = await repo.save(entity);
      this.logger.log(`Pays créé: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Erreur create country: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
