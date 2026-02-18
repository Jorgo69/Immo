/**
 * Handler : liste paginée des transactions du wallet de l'utilisateur.
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetTransactionsQuery } from '../../impl/get-transactions.query/get-transactions.query';
import { WalletEntity } from '../../../entities/wallet.entity';
import { TransactionEntity } from '../../../entities/transaction.entity';
import { buildPaginatedResult, PaginatedResultDto, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler implements IQueryHandler<GetTransactionsQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetTransactionsQuery): Promise<PaginatedResultDto<TransactionEntity>> {
    const wallet = await this.dataSource.getRepository(WalletEntity).findOne({
      where: { user_id: query.userId },
    });
    if (!wallet) {
      const page = Math.max(1, query.page ?? 1);
      const limit = Math.max(1, query.limit ?? 20);
      return buildPaginatedResult([], 0, page, limit);
    }
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const [data, total] = await this.dataSource.getRepository(TransactionEntity).findAndCount({
      where: { wallet_id: wallet.id },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResult(data, total, page, limit);
  }
}
