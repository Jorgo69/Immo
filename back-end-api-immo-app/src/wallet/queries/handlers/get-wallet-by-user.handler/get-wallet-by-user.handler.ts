/**
 * Handler : retourne le wallet de l'utilisateur (null si pas encore créé).
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetWalletByUserQuery } from '../../impl/get-wallet-by-user.query/get-wallet-by-user.query';
import { WalletEntity } from '../../../entities/wallet.entity';

@QueryHandler(GetWalletByUserQuery)
export class GetWalletByUserHandler implements IQueryHandler<GetWalletByUserQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetWalletByUserQuery): Promise<WalletEntity | null> {
    return this.dataSource.getRepository(WalletEntity).findOne({
      where: { user_id: query.userId },
    });
  }
}
