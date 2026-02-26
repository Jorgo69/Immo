/**
 * Stratégie Passport JWT — valide le token et attache l'utilisateur à la requête.
 */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from '../models/user.model/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string }): Promise<Partial<UserModel>> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'phone_number',
        'first_name',
        'last_name',
        'email',
        'avatar_url',
        'is_profile_complete',
        'is_verified',
        'preferred_lang',
        'preferred_currency',
        'preferred_theme',
        'role',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }
}
