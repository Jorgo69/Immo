/**
 * Service central d'envoi OTP multi-canal (email, WhatsApp manuel, SMS Twilio).
 * Utilise le ConfigService pour activer/désactiver les canaux (AUTH_CHANNELS).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailOtpProvider } from './providers/email-otp.provider';
import { WhatsAppManualProvider } from './providers/whatsapp-manual.provider';
import { TwilioSmsProvider } from './providers/twilio-sms.provider';
import { OtpSendContext, OtpSendResult } from './interfaces/otp-channel.interface';
import { IOtpChannelProvider } from './interfaces/otp-channel.interface';

export type AuthChannel = 'email' | 'whatsapp' | 'sms';

export interface RequestOtpNotificationResult {
  available_channels: AuthChannel[];
  whatsapp_link?: string;
  sent_channels: AuthChannel[];
}

@Injectable()
export class AuthNotificationService {
  private readonly logger = new Logger(AuthNotificationService.name);
  private readonly providers: IOtpChannelProvider[];

  constructor(
    private readonly configService: ConfigService,
    private readonly emailProvider: EmailOtpProvider,
    private readonly whatsappProvider: WhatsAppManualProvider,
    private readonly twilioProvider: TwilioSmsProvider,
  ) {
    this.providers = [this.emailProvider, this.whatsappProvider, this.twilioProvider];
  }

  /**
   * Liste des canaux activés dans la config (ex: AUTH_CHANNELS=email,whatsapp).
   */
  getActiveChannelsConfig(): AuthChannel[] {
    const raw =
      process.env.AUTH_CHANNELS ??
      this.configService.get<string>('auth.channels') ??
      'email,whatsapp';
    const list = (typeof raw === 'string' ? raw.split(',').map((s) => s.trim().toLowerCase()) : raw) as string[];
    const allowed: AuthChannel[] = ['email', 'whatsapp', 'sms'];
    return list.filter((c): c is AuthChannel => allowed.includes(c as AuthChannel));
  }

  /**
   * Canaux disponibles pour l'utilisateur : config + contexte (ex: email requis pour canal email).
   */
  getAvailableChannels(hasEmail: boolean): AuthChannel[] {
    const configChannels = this.getActiveChannelsConfig();
    const out: AuthChannel[] = [];
    for (const ch of configChannels) {
      if (ch === 'email' && !this.emailProvider.isEnabled()) continue;
      if (ch === 'email' && !hasEmail) continue;
      if (ch === 'whatsapp' && !this.whatsappProvider.isEnabled()) continue;
      if (ch === 'sms' && !this.twilioProvider.isEnabled()) continue;
      out.push(ch);
    }
    return out;
  }

  /**
   * Envoie l'OTP sur les canaux actifs (email si fourni, génère lien WhatsApp si actif).
   * Un seul code pour tous les canaux ; expire après 10 min (géré par OtpStoreService).
   */
  async sendOtp(
    phone: string,
    code: string,
    context: OtpSendContext & { channels?: AuthChannel[] },
  ): Promise<RequestOtpNotificationResult> {
    const channelsToUse =
      context.channels && context.channels.length > 0
        ? context.channels
        : this.getAvailableChannels(Boolean(context.email));
    const sent_channels: AuthChannel[] = [];
    let whatsapp_link: string | undefined;

    for (const ch of channelsToUse) {
      const provider = this.getProvider(ch);
      if (!provider?.isEnabled()) continue;
      try {
        const result = await provider.sendOtp(phone, code, { email: context.email });
        sent_channels.push(ch);
        if (result.whatsapp_link) whatsapp_link = result.whatsapp_link;
      } catch (error) {
        this.logger.warn(`Échec envoi OTP canal ${ch}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return {
      available_channels: this.getAvailableChannels(Boolean(context.email)),
      whatsapp_link,
      sent_channels,
    };
  }

  private getProvider(channel: AuthChannel): IOtpChannelProvider | null {
    return this.providers.find((p) => p.channel === channel) ?? null;
  }
}
