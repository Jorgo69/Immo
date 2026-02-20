/**
 * Vérifie l'OTP, crée l'utilisateur si inexistant (avec profil vide en transaction), puis retourne le JWT et les infos user.
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { VerifyOtpCommand } from '../../impl/verify-otp.command/verify-otp.command';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { UserModel, UserRole } from '../../../models/user.model/user.model';
import { OtpStoreService } from '../../../services/otp-store.service';
import { ProfileEntity } from '../../../../profile/entities/profile.entity';
import * as crypto from 'crypto';

export interface VerifyOtpResult {
  token: string;
  user: Partial<UserModel>;
  is_new_user: boolean;
  is_profile_complete: boolean;
}

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpCommandHandler implements ICommandHandler<VerifyOtpCommand> {
  private readonly logger = new Logger(VerifyOtpCommandHandler.name);

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpStore: OtpStoreService,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<VerifyOtpResult> {
    try {
      const valid = this.otpStore.verify(command.phone_number, command.code);
      if (!valid) {
        throw new UnauthorizedException('Code OTP invalide ou expiré');
      }

      let user = await this.userRepository.findOne({
        where: { phone_number: command.phone_number },
      });

      let is_new_user = false;
      if (!user) {
        user = await this.dataSource.manager.transaction(async (manager) => {
          const userRepo = manager.getRepository(UserModel);
          const profileRepo = manager.getRepository(ProfileEntity);
          const encryption_salt = crypto.randomBytes(24).toString('hex');
          const newUser = userRepo.create({
            phone_number: command.phone_number,
            email: command.email ?? undefined,
            preferred_lang: command.preferred_lang ?? 'fr',
            role: UserRole.TENANT,
            is_active: true,
            encryption_salt,
          });
          const savedUser = await userRepo.save(newUser);
          const profile = profileRepo.create({
            user_id: savedUser.id,
          });
          await profileRepo.save(profile);
          return savedUser;
        });
        is_new_user = true;
        this.logger.log(`Utilisateur et profil créés: ${user.phone_number}`);
      }

      const is_profile_complete = user.is_profile_complete === true;

      const payload = { sub: user.id };
      const expiresIn = this.configService.get<string>('jwt.expireIn') || '7d';
      const token = this.jwtService.sign(payload, {
        expiresIn: expiresIn as any,
        secret: this.configService.get<string>('jwt.secret'),
      });

      this.logger.log(`Connexion réussie: ${user.phone_number}`);
      return {
        token,
        is_new_user,
        is_profile_complete,
        user: this.toPublicUser(user),
      };
    } catch (error) {
      this.logger.error(`Erreur vérification OTP: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  private toPublicUser(user: UserModel): Partial<UserModel> {
    return {
      id: String(user.id),
      phone_number: user.phone_number,
      first_name: user.first_name ?? undefined,
      last_name: user.last_name ?? undefined,
      email: user.email ?? undefined,
      avatar_url: user.avatar_url ?? undefined,
      is_profile_complete: user.is_profile_complete,
      is_verified: user.is_verified,
      preferred_lang: user.preferred_lang,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
