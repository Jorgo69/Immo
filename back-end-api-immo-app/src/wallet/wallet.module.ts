/**
 * Module Wallet — Tirelire Loyer et transactions ACID.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { GetOrCreateWalletHandler } from './commands/handlers/get-or-create-wallet.handler/get-or-create-wallet.handler';
import { RecordTransactionHandler } from './commands/handlers/record-transaction.handler/record-transaction.handler';
import { GetWalletByUserHandler } from './queries/handlers/get-wallet-by-user.handler/get-wallet-by-user.handler';
import { GetTransactionsHandler } from './queries/handlers/get-transactions.handler/get-transactions.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([WalletEntity, TransactionEntity]),
  ],
  controllers: [WalletController],
  providers: [
    GetOrCreateWalletHandler,
    RecordTransactionHandler,
    GetWalletByUserHandler,
    GetTransactionsHandler,
  ],
})
export class WalletModule {}
