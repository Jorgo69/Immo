/**
 * Met à jour les champs autorisés de l'utilisateur connecté.
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from '../../impl/update-user.command/update-user.command';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { UserModel } from '../../../../auth/models/user.model/user.model';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly logger = new Logger(UpdateUserCommandHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: UpdateUserCommand): Promise<Partial<UserModel>> {
    try {
      const userRepository = this.dataSource.getRepository(UserModel);

      const user = await userRepository.findOne({
        where: { id: command.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (command.preferred_lang !== undefined) {
        user.preferred_lang = command.preferred_lang;
      }
      if (command.role !== undefined) {
        user.role = command.role;
      }
      if (command.is_active !== undefined) {
        user.is_active = command.is_active;
      }

      const updated = await userRepository.save(user);
      this.logger.log(`User updated: ${updated.id}`);

      return {
        id: updated.id,
        phone_number: updated.phone_number,
        preferred_lang: updated.preferred_lang,
        role: updated.role,
        is_active: updated.is_active,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error updating user: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
