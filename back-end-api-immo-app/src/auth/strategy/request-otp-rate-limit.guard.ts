/**
 * Rate limiting basique pour POST /auth/request-otp.
 * Limite le nombre de demandes OTP par IP pour protéger le service SMS/WhatsApp (Twilio, etc.).
 */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3;

interface WindowState {
  count: number;
  resetAt: number;
}

@Injectable()
export class RequestOtpRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, WindowState>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.getClientKey(request);

    const now = Date.now();
    let state = this.store.get(key);

    if (!state) {
      state = { count: 1, resetAt: now + WINDOW_MS };
      this.store.set(key, state);
      return true;
    }

    if (now >= state.resetAt) {
      state = { count: 1, resetAt: now + WINDOW_MS };
      this.store.set(key, state);
      return true;
    }

    state.count += 1;
    if (state.count > MAX_REQUESTS) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Trop de demandes. Réessayez dans une minute.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientKey(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
