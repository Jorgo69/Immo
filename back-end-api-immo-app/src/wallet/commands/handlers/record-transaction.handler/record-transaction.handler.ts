/**
 * Handler : enregistre une transaction et met à jour les soldes en ACID.
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { BadRequestException, Logger } from '@nestjs/common';
import { RecordTransactionCommand } from '../../impl/record-transaction.command/record-transaction.command';
import { WalletEntity } from '../../../entities/wallet.entity';
import { TransactionEntity, TransactionStatus, TransactionType } from '../../../entities/transaction.entity';

@CommandHandler(RecordTransactionCommand)
export class RecordTransactionHandler implements ICommandHandler<RecordTransactionCommand> {
  private readonly logger = new Logger(RecordTransactionHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: RecordTransactionCommand): Promise<TransactionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const walletRepo = queryRunner.manager.getRepository(WalletEntity);
      const txRepo = queryRunner.manager.getRepository(TransactionEntity);

      const wallet = await walletRepo.findOne({ where: { user_id: command.userId } });
      if (!wallet) {
        throw new BadRequestException('Wallet introuvable pour cet utilisateur');
      }

      const amountStr = String(command.amount);
      const transaction = txRepo.create({
        wallet_id: wallet.id,
        amount: amountStr,
        type: command.type,
        status: TransactionStatus.COMPLETED,
        gateway_ref: command.gateway_ref ?? null,
      });
      const savedTx = await txRepo.save(transaction);

      const currentTotal = parseFloat(wallet.balance_total);
      const currentSavings = parseFloat(wallet.balance_savings);
      const amount = command.amount;

      if (command.type === TransactionType.SAVING) {
        wallet.balance_savings = String(currentSavings + amount);
        wallet.balance_total = String(currentTotal + amount);
      } else {
        wallet.balance_total = String(currentTotal + amount);
      }
      await walletRepo.save(wallet);

      await queryRunner.commitTransaction();
      this.logger.log(`Transaction ${savedTx.id} enregistrée (${command.type}, ${amount})`);
      return savedTx;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Erreur record transaction: ${error instanceof Error ? error.message : error}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
