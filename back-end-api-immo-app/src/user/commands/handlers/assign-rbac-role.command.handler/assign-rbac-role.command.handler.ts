import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignRbacRoleCommand } from '../../impl/assign-rbac-role.command/assign-rbac-role.command';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { RoleEntity } from '../../../../rbac/entities/role.entity';
import { AuditService } from '../../../../audit/audit.service';
import { ActivityAction } from '../../../../audit/entities/activity-log.entity';

@CommandHandler(AssignRbacRoleCommand)
export class AssignRbacRoleCommandHandler implements ICommandHandler<AssignRbacRoleCommand> {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly auditService: AuditService,
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

    // Sauvegarder l'ancien état pour l'audit
    const oldRoleId = user.rbac_role?.id || null;
    const oldRoleName = user.rbac_role?.name || 'Aucun';

    user.rbac_role = newRole;
    await this.userRepository.save(user);

    // Enregistrer l'audit
    await this.auditService.logActivity({
      userId: user.id, // Utilisateur ciblé
      action: ActivityAction.UPDATE,
      entityType: 'USER_ROLE',
      entityId: user.id,
      oldValues: { roleId: oldRoleId, roleName: oldRoleName },
      newValues: { roleId: newRole?.id || null, roleName: newRole?.name || 'Aucun' },
      description: `Changement de rôle RBAC. Raison: ${reason || 'Non spécifiée'}`,
    });

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
