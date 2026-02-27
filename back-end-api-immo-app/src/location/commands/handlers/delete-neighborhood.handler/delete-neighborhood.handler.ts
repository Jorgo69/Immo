import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NeighborhoodEntity } from '../../../entities/neighborhood.entity';
import { DeleteNeighborhoodCommand } from '../../impl/delete-neighborhood.command/delete-neighborhood.command';

@CommandHandler(DeleteNeighborhoodCommand)
export class DeleteNeighborhoodHandler implements ICommandHandler<DeleteNeighborhoodCommand> {
  constructor(
    @InjectRepository(NeighborhoodEntity)
    private readonly repo: Repository<NeighborhoodEntity>,
  ) {}

  async execute(command: DeleteNeighborhoodCommand): Promise<void> {
    const n = await this.repo.findOne({ where: { id: command.id } });
    if (!n) throw new NotFoundException('Quartier introuvable');
    await this.repo.delete(command.id);
  }
}
