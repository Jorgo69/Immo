/**
 * Génère un lien wa.me pour que l'utilisateur reçoive le code via WhatsApp (manuel / bootstrapper).
 * Le frontend affiche le lien ; pas d'API WhatsApp payante.
 */
import { Injectable } from '@nestjs/common';
import { IOtpChannelProvider, OtpSendContext, OtpSendResult } from '../interfaces/otp-channel.interface';

@Injectable()
export class WhatsAppManualProvider implements IOtpChannelProvider {
  readonly channel = 'whatsapp' as const;

  /** Toujours "actif" : on peut toujours générer un lien. */
  isEnabled(): boolean {
    return true;
  }

  async sendOtp(phone: string, code: string, _context?: OtpSendContext): Promise<OtpSendResult> {
    const normalized = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Mon code de vérification Immo Bénin est : ${code}`);
    const whatsapp_link = `https://wa.me/${normalized}?text=${message}`;
    return { whatsapp_link };
  }
}
