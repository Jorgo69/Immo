/**
 * Auth Me Handler - Standard 41DEVS
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AuthMeQuery } from '../../impl/auth-me.query/auth-me.query';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserModel } from '../../../models/user.model/user.model';

@QueryHandler(AuthMeQuery)
export class AuthMeHandler implements IQueryHandler<AuthMeQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: AuthMeQuery): Promise<any> {
    const user = await this.dataSource.getRepository(UserModel).findOne({
      where: { id: query.userId },
      select: ['id', 'phone_number', 'preferred_lang', 'role', 'is_active', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
