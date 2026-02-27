import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { NeighborhoodEntity } from '../../../entities/neighborhood.entity';
import { CreateNeighborhoodCommand } from '../../impl/create-neighborhood.command/create-neighborhood.command';

@CommandHandler(CreateNeighborhoodCommand)
export class CreateNeighborhoodHandler implements ICommandHandler<CreateNeighborhoodCommand> {
  constructor(
    @InjectRepository(NeighborhoodEntity)
    private readonly repo: Repository<NeighborhoodEntity>,
  ) {}

  async execute(command: CreateNeighborhoodCommand): Promise<NeighborhoodEntity> {
    const existing = await this.repo.findOne({
      where: { city_id: command.city_id, name: command.name },
    });
    if (existing) {
      throw new ConflictException('Un quartier avec ce nom existe déjà pour cette ville');
    }

    const n = this.repo.create({
      city_id: command.city_id,
      name: command.name,
    });
    return this.repo.save(n);
  }
}
