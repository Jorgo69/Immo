/**
 * Find User By Id Handler - Standard 41DEVS
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindByIdQuery } from '../../impl/find-by-id.query/find-by-id.query';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserModel } from '../../../../auth/models/user.model/user.model';

@QueryHandler(FindByIdQuery)
export class FindByIdHandler implements IQueryHandler<FindByIdQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: FindByIdQuery): Promise<any> {
    const user = await this.dataSource.getRepository(UserModel).findOne({
      where: { id: query.id },
      select: ['id', 'phone_number', 'preferred_lang', 'role', 'is_active', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
