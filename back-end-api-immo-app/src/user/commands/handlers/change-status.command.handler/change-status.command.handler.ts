import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { ChangeStatusCommand } from '../../impl/change-status.command/change-status.command';
import { UserModel } from '../../../../auth/models/user.model/user.model';

@CommandHandler(ChangeStatusCommand)
export class ChangeStatusCommandHandler implements ICommandHandler<ChangeStatusCommand> {
  private readonly logger = new Logger(ChangeStatusCommandHandler.name);

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async execute(command: ChangeStatusCommand): Promise<Partial<UserModel>> {
    const user = await this.userRepository.findOne({ where: { id: command.id } });
    
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    user.status = command.status;
    const updated = await this.userRepository.save(user);

    this.logger.log(`Statut utilisateur ${updated.id} changé en ${updated.status}. Motif: ${command.reason}`);

    return {
      id: updated.id,
      phone_number: updated.phone_number,
      first_name: updated.first_name ?? undefined,
      last_name: updated.last_name ?? undefined,
      email: updated.email ?? undefined,
      role: updated.role,
      status: updated.status,
    };
  }
}
