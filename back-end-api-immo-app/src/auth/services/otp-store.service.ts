/**
 * Stockage temporaire des OTP (en mémoire pour le dev).
 * En production : remplacer par Redis ou autre store avec TTL.
 */
import { Injectable, Logger } from '@nestjs/common';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 6;

interface OtpEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class OtpStoreService {
  private readonly logger = new Logger(OtpStoreService.name);
  private readonly store = new Map<string, OtpEntry>();

  /**
   * Génère un code OTP à 6 chiffres et le stocke pour le numéro donné.
   */
  set(phoneNumber: string): string {
    const code = this.generateCode();
    this.store.set(phoneNumber, {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    this.logger.debug(`OTP stored for ${phoneNumber} (expires in ${OTP_TTL_MS / 1000}s)`);
    return code;
  }

  /**
   * Vérifie le code pour un numéro. Retourne true si valide, false sinon.
   * Supprime l'entrée après vérification (one-time use).
   */
  verify(phoneNumber: string, code: string): boolean {
    const entry = this.store.get(phoneNumber);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(phoneNumber);
      return false;
    }
    const valid = entry.code === code;
    this.store.delete(phoneNumber);
    return valid;
  }

  private generateCode(): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }
}
