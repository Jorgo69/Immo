/**
 * Met à jour le profil (onboarding) : first_name, last_name, email?, avatar_url?.
 * Passe is_profile_complete à true dès que prénom et nom sont renseignés.
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { UpdateProfileCommand } from '../../impl/update-profile.command/update-profile.command';
import { UserModel } from '../../../../auth/models/user.model/user.model';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileCommandHandler implements ICommandHandler<UpdateProfileCommand> {
  private readonly logger = new Logger(UpdateProfileCommandHandler.name);

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<Partial<UserModel>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: command.id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.first_name = command.first_name?.trim() ?? user.first_name;
      user.last_name = command.last_name?.trim() ?? user.last_name;
      if (command.email !== undefined) user.email = command.email?.trim() || null;
      if (command.avatar_url !== undefined) user.avatar_url = command.avatar_url || null;

      user.is_profile_complete = !!(user.first_name?.trim() && user.last_name?.trim());

      const updated = await this.userRepository.save(user);
      this.logger.log(`Profil complété: ${updated.id}`);

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
        role: updated.role,
        status: updated.status,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error updating profile: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
