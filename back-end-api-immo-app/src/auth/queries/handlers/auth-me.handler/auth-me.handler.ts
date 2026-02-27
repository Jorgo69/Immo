/**
 * Auth Me Handler - Retourne l'utilisateur connecté avec son profil (kyc_status, etc.).
 * Réponse : { id, phone_number, role, profile: { kyc_status, ... }, ... }.
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthMeQuery } from '../../impl/auth-me.query/auth-me.query';
import { NotFoundException } from '@nestjs/common';
import { UserModel } from '../../../models/user.model/user.model';
import { ProfileEntity } from '../../../../profile/entities/profile.entity';

const ME_SELECT: (keyof UserModel)[] = [
  'id',
  'phone_number',
  'first_name',
  'last_name',
  'email',
  'avatar_url',
  'is_profile_complete',
  'is_verified',
  'id_card_url',
  'phone_verified',
  'preferred_lang',
  'preferred_currency',
  'preferred_theme',
  'role',
  'status',
  'created_at',
  'updated_at',
];

export interface AuthMeResult {
  id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  is_profile_complete?: boolean;
  is_verified?: boolean;
  id_card_url?: string | null;
  phone_verified?: boolean;
  preferred_lang: string;
  preferred_currency: string;
  preferred_theme: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  profile: { id: string; user_id: string; kyc_status: string } | null;
}

@QueryHandler(AuthMeQuery)
export class AuthMeHandler implements IQueryHandler<AuthMeQuery> {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async execute(query: AuthMeQuery): Promise<AuthMeResult> {
    const user = await this.userRepository.findOne({
      where: { id: query.userId },
      select: ME_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profileRepository.findOne({
      where: { user_id: query.userId },
      select: ['id', 'user_id', 'kyc_status'],
    });

    return {
      ...user,
      profile: profile ? { id: profile.id, user_id: profile.user_id, kyc_status: profile.kyc_status } : null,
    };
  }
}
