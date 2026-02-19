/**
 * Envoi du code OTP par email via SMTP (Nodemailer).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IOtpChannelProvider, OtpSendContext, OtpSendResult } from '../interfaces/otp-channel.interface';

@Injectable()
export class EmailOtpProvider implements IOtpChannelProvider {
  readonly channel = 'email' as const;
  private readonly logger = new Logger(EmailOtpProvider.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransport();
  }

  private initTransport(): void {
    try {
      const host = this.configService.get<string>('smtp.host') ?? this.configService.get<string>('SMTP_HOST');
      const port = this.configService.get<number>('smtp.port') ?? this.configService.get<number>('SMTP_PORT') ?? 587;
      const user = this.configService.get<string>('smtp.user') ?? this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('smtp.password') ?? this.configService.get<string>('SMTP_PASS');
      if (host && user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: this.configService.get<boolean>('smtp.secure') ?? false,
          auth: { user, pass },
        });
        this.logger.log('Transport SMTP initialisé');
      }
    } catch (e) {
      this.logger.warn(`SMTP non configuré: ${e instanceof Error ? e.message : e}`);
    }
  }

  isEnabled(): boolean {
    return this.transporter != null;
  }

  async sendOtp(phone: string, code: string, context?: OtpSendContext): Promise<OtpSendResult> {
    const email = context?.email;
    if (!email || !this.transporter) {
      if (!email) this.logger.debug('Canal email ignoré: pas d\'adresse email');
      return {};
    }
    const from = this.configService.get<string>('smtp.from') ?? this.configService.get<string>('SMTP_FROM') ?? 'Immo Bénin <noreply@immo-benin.local>';
    const html = this.buildHtml(code);
    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Votre code de vérification Immo Bénin',
        text: `Votre code de vérification est : ${code}. Il expire dans 10 minutes.`,
        html,
      });
      this.logger.log(`OTP envoyé par email à ${email}`);
      return {};
    } catch (error) {
      this.logger.error(`Erreur envoi email OTP: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  private buildHtml(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#F9FAFB;padding:24px;">
  <div style="max-width:400px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <p style="margin:0 0 8px;font-size:14px;color:#6B7280;">Immo Bénin</p>
    <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#111827;">Votre code de vérification</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;">Utilisez le code ci-dessous pour vous connecter :</p>
    <p style="margin:0 0 24px;font-size:28px;font-weight:700;letter-spacing:4px;color:#059669;">${code}</p>
    <p style="margin:0;font-size:13px;color:#6B7280;">Ce code expire dans 10 minutes. Ne le partagez avec personne.</p>
  </div>
</body>
</html>`.trim();
  }
}
