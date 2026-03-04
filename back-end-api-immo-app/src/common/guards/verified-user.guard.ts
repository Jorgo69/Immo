import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard qui vérifie si l'utilisateur est vérifié (is_verified = true).
 * Utilisé pour restreindre les actions critiques comme la publication de biens ou de demandes.
 */
@Injectable()
export class VerifiedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // L'admin est toujours considéré comme vérifié (en interne)
    if (user.role === 'admin') {
      return true;
    }

    if (!user.is_verified) {
      throw new ForbiddenException('error.KYC_REQUIRED');
    }

    return true;
  }
}
