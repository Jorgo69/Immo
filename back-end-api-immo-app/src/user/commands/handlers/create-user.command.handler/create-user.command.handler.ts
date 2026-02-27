/**
 * Crée un utilisateur en base (appelé par l'admin ou un formulaire d'inscription complet).
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, Logger } from '@nestjs/common';
import { CreateUserCommand } from '../../impl/create-user.command/create-user.command';
import { UserModel, UserRole, UserStatus } from '../../../../auth/models/user.model/user.model';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  private readonly logger = new Logger(CreateUserCommandHandler.name);

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async execute(command: CreateUserCommand): Promise<Partial<UserModel>> {
    try {
      const existing = await this.userRepository.findOne({
        where: { phone_number: command.phone_number },
      });
      if (existing) {
        throw new ConflictException('Un utilisateur avec ce numéro existe déjà');
      }

      if (command.email) {
        const existingEmail = await this.userRepository.findOne({
          where: { email: command.email },
        });
        if (existingEmail) {
          throw new ConflictException('Un utilisateur avec cet email existe déjà');
        }
      }

      const user = this.userRepository.create({
        phone_number: command.phone_number,
        first_name: command.first_name ?? null,
        last_name: command.last_name ?? null,
        email: command.email ?? null,
        preferred_lang: command.preferred_lang ?? 'fr',
        role: command.role ?? UserRole.TENANT,
        status: UserStatus.ACTIVE,
      });

      const saved = await this.userRepository.save(user);
      this.logger.log(`User created: ${saved.id} (${saved.phone_number})`);

      return {
        id: saved.id,
        phone_number: saved.phone_number,
        first_name: saved.first_name ?? undefined,
        last_name: saved.last_name ?? undefined,
        email: saved.email ?? undefined,
        preferred_lang: saved.preferred_lang,
        role: saved.role,
        status: saved.status,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error creating user: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
