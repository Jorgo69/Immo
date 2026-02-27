import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignRbacRoleCommand } from '../../impl/assign-rbac-role.command/assign-rbac-role.command';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { RoleEntity } from '../../../../rbac/entities/role.entity';

@CommandHandler(AssignRbacRoleCommand)
export class AssignRbacRoleCommandHandler implements ICommandHandler<AssignRbacRoleCommand> {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async execute(command: AssignRbacRoleCommand): Promise<Partial<UserModel>> {
    const { userId, roleId, reason } = command;

    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['rbac_role'] });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    let newRole = null;
    if (roleId) {
      newRole = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!newRole) throw new NotFoundException('Rôle RBAC introuvable');
    }

    // Protection contre l'usurpation accidentelle (System Admin réservé, etc.)
    // Idéalement on garde cette sécurité si besoin, on laisse ouvert pour l'Admin pour l'instant
    user.rbac_role = newRole;

    await this.userRepository.save(user);

    // L'ajout dans la table des audits pourrait se faire via un Event ou l'intercepteur global
    // "Action effectuée pour la raison : reason"

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      rbac_role: user.rbac_role
    };
  }
}
