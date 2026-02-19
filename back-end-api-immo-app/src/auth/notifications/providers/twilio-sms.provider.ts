/**
 * Provider SMS via Twilio — préparé pour la scalabilité, désactivé par défaut (coût).
 * Activer en ajoutant "sms" dans auth.channels et en configurant TWILIO_*.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IOtpChannelProvider, OtpSendContext, OtpSendResult } from '../interfaces/otp-channel.interface';

@Injectable()
export class TwilioSmsProvider implements IOtpChannelProvider {
  readonly channel = 'sms' as const;
  private readonly logger = new Logger(TwilioSmsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    const accountSid = this.configService.get<string>('twilio.accountSid') ?? this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('twilio.authToken') ?? this.configService.get<string>('TWILIO_AUTH_TOKEN');
    return Boolean(accountSid && authToken);
  }

  async sendOtp(phone: string, code: string, _context?: OtpSendContext): Promise<OtpSendResult> {
    if (!this.isEnabled()) {
      this.logger.warn('Twilio désactivé : configurez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN pour activer le SMS.');
      return {};
    }
    // TODO: const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({ body: `Votre code Immo Bénin : ${code}`, from: twilioPhone, to: phone });
    this.logger.debug(`SMS OTP (Twilio) non envoyé — provider préparé pour ${phone}`);
    return {};
  }
}
