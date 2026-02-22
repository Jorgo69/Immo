/**
 * Controller Wallet — Tirelire et transactions.
 */
import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';
import { GetOrCreateWalletCommand } from './commands/impl/get-or-create-wallet.command/get-or-create-wallet.command';
import { RecordTransactionCommand } from './commands/impl/record-transaction.command/record-transaction.command';
import { GetWalletByUserQuery } from './queries/impl/get-wallet-by-user.query/get-wallet-by-user.query';
import { GetTransactionsQuery } from './queries/impl/get-transactions.query/get-transactions.query';
import { GetAllTransactionsAuditQuery } from './queries/impl/get-all-transactions-audit.query/get-all-transactions-audit.query';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon wallet (créé automatiquement si absent)' })
  async getOrCreateMe(@Request() req: { user: { id: string } }) {
    const cmd = new GetOrCreateWalletCommand();
    cmd.userId = req.user.id;
    return this.commandBus.execute(cmd);
  }

  @Post('transaction')
  @ApiOperation({ summary: 'Enregistrer une transaction (ex. versement Tirelire)' })
  async recordTransaction(
    @Body() body: Omit<RecordTransactionCommand, 'userId'>,
    @Request() req: { user: { id: string } },
  ) {
    const cmd = new RecordTransactionCommand();
    cmd.userId = req.user.id;
    cmd.amount = body.amount;
    cmd.type = body.type;
    cmd.gateway_ref = body.gateway_ref;
    return this.commandBus.execute(cmd);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Liste de mes transactions (paginée)' })
  async getTransactions(
    @Request() req: { user: { id: string } },
    @Query() q: Pick<GetTransactionsQuery, 'page' | 'limit'>,
  ) {
    const query = new GetTransactionsQuery();
    query.userId = req.user.id;
    query.page = q.page;
    query.limit = q.limit;
    return this.queryBus.execute(query);
  }

  @Get('audit/transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Audit : toutes les transactions (lecture seule, admin)' })
  async getAuditTransactions(@Query() q: GetAllTransactionsAuditQuery) {
    return this.queryBus.execute(q);
  }
}
