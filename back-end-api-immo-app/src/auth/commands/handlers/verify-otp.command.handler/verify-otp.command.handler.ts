/**
 * Vérifie l'OTP, crée l'utilisateur si inexistant, puis retourne le JWT et les infos user.
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyOtpCommand } from '../../impl/verify-otp.command/verify-otp.command';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { UserModel, UserRole } from '../../../models/user.model/user.model';
import { OtpStoreService } from '../../../services/otp-store.service';

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpCommandHandler implements ICommandHandler<VerifyOtpCommand> {
  private readonly logger = new Logger(VerifyOtpCommandHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpStore: OtpStoreService,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<{ token: string; user: Partial<UserModel> }> {
    try {
      const valid = this.otpStore.verify(command.phone_number, command.code);
      if (!valid) {
        throw new UnauthorizedException('Code OTP invalide ou expiré');
      }

      const userRepository = this.dataSource.getRepository(UserModel);
      let user = await userRepository.findOne({
        where: { phone_number: command.phone_number },
      });

      if (!user) {
        user = userRepository.create({
          phone_number: command.phone_number,
          preferred_lang: command.preferred_lang ?? 'fr',
          role: UserRole.TENANT,
          is_active: true,
        });
        user = await userRepository.save(user);
        this.logger.log(`Utilisateur créé: ${user.phone_number}`);
      }

      const payload = { sub: user.id };
      const expiresIn = this.configService.get<string>('jwt.expireIn') || '7d';
      const token = this.jwtService.sign(payload, {
        expiresIn: expiresIn as any,
        secret: this.configService.get<string>('jwt.secret'),
      });

      this.logger.log(`Connexion réussie: ${user.phone_number}`);
      return {
        token,
        user: {
          id: String(user.id),
          phone_number: user.phone_number,
          preferred_lang: user.preferred_lang,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      };
    } catch (error) {
      this.logger.error(`Erreur vérification OTP: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
