/**
 * Met à jour les champs autorisés de l'utilisateur connecté (profil, langue, rôle).
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserCommand } from '../../impl/update-user.command/update-user.command';
import { Logger, NotFoundException } from '@nestjs/common';
import { UserModel } from '../../../../auth/models/user.model/user.model';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly logger = new Logger(UpdateUserCommandHandler.name);

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async execute(command: UpdateUserCommand): Promise<Partial<UserModel>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: command.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (command.first_name !== undefined) user.first_name = command.first_name;
      if (command.last_name !== undefined) user.last_name = command.last_name;
      if (command.email !== undefined) user.email = command.email;
      if (command.avatar_url !== undefined) user.avatar_url = command.avatar_url;
      if (command.preferred_lang !== undefined) user.preferred_lang = command.preferred_lang;
      if (command.preferred_currency !== undefined) user.preferred_currency = command.preferred_currency;
      if (command.preferred_theme !== undefined) user.preferred_theme = command.preferred_theme;
      if (command.role !== undefined) user.role = command.role;
      if (command.status !== undefined) user.status = command.status;

      user.is_profile_complete = !!(user.first_name?.trim() && user.last_name?.trim());

      const updated = await this.userRepository.save(user);
      this.logger.log(`User updated: ${updated.id}`);

      return {
        id: updated.id,
        phone_number: updated.phone_number,
        first_name: updated.first_name ?? undefined,
        last_name: updated.last_name ?? undefined,
        email: updated.email ?? undefined,
        avatar_url: updated.avatar_url ?? undefined,
        is_profile_complete: updated.is_profile_complete,
        is_verified: updated.is_verified,
        preferred_lang: updated.preferred_lang,
        preferred_currency: updated.preferred_currency,
        preferred_theme: updated.preferred_theme,
        role: updated.role,
        status: updated.status,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error updating user: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
