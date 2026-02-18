/**
 * Delete User Command Handler - Standard 41DEVS
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../../impl/delete-user.command/delete-user.command';
import { DataSource } from 'typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { UserModel } from '../../../../auth/models/user.model/user.model';

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler implements ICommandHandler<DeleteUserCommand> {
  private readonly logger = new Logger(DeleteUserCommandHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: DeleteUserCommand): Promise<any> {
    const userRepository = this.dataSource.getRepository(UserModel);

    const user = await userRepository.findOne({
      where: { id: command.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await userRepository.softRemove(user);

    this.logger.log(`User soft-deleted (données conservées): ${command.id}`);
    return { message: 'User deleted successfully' };
  }
}
