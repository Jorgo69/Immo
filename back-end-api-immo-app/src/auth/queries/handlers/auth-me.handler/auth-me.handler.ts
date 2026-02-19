/**
 * Auth Me Handler - Retourne le profil de l'utilisateur connecté (champs publics).
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthMeQuery } from '../../impl/auth-me.query/auth-me.query';
import { NotFoundException } from '@nestjs/common';
import { UserModel } from '../../../models/user.model/user.model';

const ME_SELECT: (keyof UserModel)[] = [
  'id',
  'phone_number',
  'first_name',
  'last_name',
  'email',
  'avatar_url',
  'is_profile_complete',
  'is_verified',
  'preferred_lang',
  'role',
  'is_active',
  'created_at',
  'updated_at',
];

@QueryHandler(AuthMeQuery)
export class AuthMeHandler implements IQueryHandler<AuthMeQuery> {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async execute(query: AuthMeQuery): Promise<Partial<UserModel>> {
    const user = await this.userRepository.findOne({
      where: { id: query.userId },
      select: ME_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
