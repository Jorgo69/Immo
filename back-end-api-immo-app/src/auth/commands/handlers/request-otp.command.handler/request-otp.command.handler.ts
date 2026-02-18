/**
 * Enregistre un OTP pour le numéro et simule l'envoi (SMS/WhatsApp à brancher plus tard).
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RequestOtpCommand } from '../../impl/request-otp.command/request-otp.command';
import { OtpStoreService } from '../../../services/otp-store.service';
import { Logger } from '@nestjs/common';

@CommandHandler(RequestOtpCommand)
export class RequestOtpCommandHandler implements ICommandHandler<RequestOtpCommand> {
  private readonly logger = new Logger(RequestOtpCommandHandler.name);

  constructor(private readonly otpStore: OtpStoreService) {}

  async execute(command: RequestOtpCommand): Promise<{ success: boolean }> {
    try {
      const code = this.otpStore.set(command.phone_number);
      // TODO: intégration WhatsApp/SMS (Twilio, etc.) pour envoyer `code` à command.phone_number
      this.logger.log(`OTP demandé pour ${command.phone_number} (dev: code=${code})`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Erreur demande OTP: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
