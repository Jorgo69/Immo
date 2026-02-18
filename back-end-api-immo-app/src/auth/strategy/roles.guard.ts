/**
 * Guard : n'autorise l'accès que si le rôle de l'utilisateur connecté est dans la liste autorisée.
 * À utiliser après JwtAuthGuard (req.user doit être défini).
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../models/user.model/user.model';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user?: { role?: UserRole } }>();
    if (!user?.role) {
      throw new ForbiddenException('Accès réservé');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Accès réservé');
    }
    return true;
  }
}
