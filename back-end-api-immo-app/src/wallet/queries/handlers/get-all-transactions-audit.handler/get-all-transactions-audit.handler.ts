/**
 * Handler : liste paginée de toutes les transactions (audit admin, lecture seule).
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetAllTransactionsAuditQuery } from '../../impl/get-all-transactions-audit.query/get-all-transactions-audit.query';
import { TransactionEntity } from '../../../entities/transaction.entity';
import { buildPaginatedResult, PaginatedResultDto, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

@QueryHandler(GetAllTransactionsAuditQuery)
export class GetAllTransactionsAuditHandler implements IQueryHandler<GetAllTransactionsAuditQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetAllTransactionsAuditQuery): Promise<PaginatedResultDto<TransactionEntity>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const repo = this.dataSource.getRepository(TransactionEntity);
    const [data, total] = await repo.findAndCount({
      relations: ['wallet'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResult(data, total, page, limit);
  }
}
