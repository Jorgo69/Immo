import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { DataSource } from 'typeorm';
import { UserModel } from '../../auth/models/user.model/user.model';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Si la route n'exige aucune permission RBAC, on laisse passer (gestion via Jwt/RolesGuard classique)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.id) {
      throw new ForbiddenException('Utilisateur non identifié');
    }

    // Récupérer l'utilisateur avec son rôle et ses permissions
    const userRepository = this.dataSource.getRepository(UserModel);
    const userWithRole = await userRepository.findOne({
      where: { id: user.id },
      relations: ['rbac_role', 'rbac_role.permissions'],
    });

    if (!userWithRole || !userWithRole.rbac_role) {
      throw new ForbiddenException('Accès refusé. Aucun rôle dynamique assigné.');
    }

    // Un rôle 'System Admin' pourrait bypasser virtuellement (optionnel, on gère ça implicitement via les permissions affectées)
    const userPermissions = userWithRole.rbac_role.permissions.map(p => p.name);

    // Vérifier si l'utilisateur a toutes les permissions requises
    const hasAll = requiredPermissions.every(rp => userPermissions.includes(rp));

    if (!hasAll) {
      throw new ForbiddenException(`Permissions insuffisantes. Requis: [${requiredPermissions.join(', ')}]`);
    }

    return true;
  }
}
