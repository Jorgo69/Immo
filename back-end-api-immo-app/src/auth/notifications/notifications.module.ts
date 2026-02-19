/**
 * Module des canaux de notification OTP (email, WhatsApp, SMS).
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthNotificationService } from './auth-notification.service';
import { EmailOtpProvider } from './providers/email-otp.provider';
import { WhatsAppManualProvider } from './providers/whatsapp-manual.provider';
import { TwilioSmsProvider } from './providers/twilio-sms.provider';

@Module({
  imports: [ConfigModule],
  providers: [EmailOtpProvider, WhatsAppManualProvider, TwilioSmsProvider, AuthNotificationService],
  exports: [AuthNotificationService],
})
export class AuthNotificationsModule {}
