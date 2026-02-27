import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditContext, AuditContextInfo } from '../audit.context';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    const contextInfo: AuditContextInfo = {
      userId: req.user?.id, // Le JWT Guard a déjà injecté req.user si authentifié
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    // On englobe l'exécution de la requête dans l'AsyncLocalStorage
    return new Observable(subscriber => {
      AuditContext.run(contextInfo, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
