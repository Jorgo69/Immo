/**
 * Décorateur pour restreindre l'accès aux routes par rôle.
 */
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../models/user.model/user.model';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
