/**
 * Demande d'OTP : génère le code, le stocke (10 min), envoie via les canaux actifs
 * (email si configuré + email connu, lien WhatsApp si actif) et renvoie les infos au frontend.
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestOtpCommand } from '../../impl/request-otp.command/request-otp.command';
import { OtpStoreService } from '../../../services/otp-store.service';
import { AuthNotificationService, AuthChannel } from '../../../notifications/auth-notification.service';
import { UserModel } from '../../../models/user.model/user.model';
import { Logger } from '@nestjs/common';

export interface RequestOtpResult {
  success: boolean;
  available_channels: AuthChannel[];
  whatsapp_link?: string;
  sent_channels?: AuthChannel[];
}

@CommandHandler(RequestOtpCommand)
export class RequestOtpCommandHandler implements ICommandHandler<RequestOtpCommand> {
  private readonly logger = new Logger(RequestOtpCommandHandler.name);

  constructor(
    private readonly otpStore: OtpStoreService,
    private readonly authNotification: AuthNotificationService,
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async execute(command: RequestOtpCommand): Promise<RequestOtpResult> {
    try {
      const email = await this.getEmailForChannel(command.phone_number, command.email);
      const available_channels = this.authNotification.getAvailableChannels(Boolean(email));

      const code = this.otpStore.set(command.phone_number);

      const result = await this.authNotification.sendOtp(command.phone_number, code, {
        email: email ?? undefined,
        channels: available_channels,
      });

      this.logger.log(
        `OTP demandé pour ${command.phone_number} (canaux: ${result.sent_channels.join(', ') || 'aucun'})`,
      );

      return {
        success: true,
        available_channels: result.available_channels,
        whatsapp_link: result.whatsapp_link,
        sent_channels: result.sent_channels,
      };
    } catch (error) {
      this.logger.error(`Erreur demande OTP: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /** Email de l'utilisateur existant ou fourni en body (nouveau). */
  private async getEmailForChannel(phone_number: string, bodyEmail?: string): Promise<string | null> {
    const user = await this.userRepository.findOne({
      where: { phone_number },
      select: ['email'],
    });
    return user?.email ?? bodyEmail ?? null;
  }
}
