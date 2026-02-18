import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { CreateRoomCommand } from '../../impl/create-room.command/create-room.command';
import { RoomEntity } from '../../../entities/room.entity';
import { PropertyEntity } from '../../../entities/property.entity';

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<CreateRoomCommand> {
  private readonly logger = new Logger(CreateRoomHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateRoomCommand): Promise<RoomEntity> {
    try {
      const propertyRepo = this.dataSource.getRepository(PropertyEntity);
      const property = await propertyRepo.findOne({ where: { id: command.property_id } });
      if (!property) {
        throw new NotFoundException('Property not found');
      }

      const repo = this.dataSource.getRepository(RoomEntity);
      const entity = repo.create({
        property_id: command.property_id,
        name: command.name,
        type: command.type ?? null,
        price_monthly: command.price_monthly != null ? String(command.price_monthly) : null,
        surface_m2: command.surface_m2 ?? null,
        floor: command.floor ?? null,
        is_available: command.is_available ?? true,
        description_translations: command.description_translations ?? null,
      });
      const saved = await repo.save(entity);
      this.logger.log(`Room créée: ${saved.id} (property: ${command.property_id})`);
      return saved;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur create room: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
