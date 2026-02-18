/**
 * Handler : récupère ou crée le wallet pour l'utilisateur.
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetOrCreateWalletCommand } from '../../impl/get-or-create-wallet.command/get-or-create-wallet.command';
import { WalletEntity } from '../../../entities/wallet.entity';
import { Logger } from '@nestjs/common';

@CommandHandler(GetOrCreateWalletCommand)
export class GetOrCreateWalletHandler implements ICommandHandler<GetOrCreateWalletCommand> {
  private readonly logger = new Logger(GetOrCreateWalletHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: GetOrCreateWalletCommand): Promise<WalletEntity> {
    try {
      const repo = this.dataSource.getRepository(WalletEntity);
      let wallet = await repo.findOne({ where: { user_id: command.userId } });
      if (!wallet) {
        wallet = repo.create({
          user_id: command.userId,
          balance_total: '0',
          balance_savings: '0',
        });
        wallet = await repo.save(wallet);
        this.logger.log(`Wallet créé pour user ${command.userId}`);
      }
      return wallet;
    } catch (error) {
      this.logger.error(`Erreur get-or-create wallet: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }
}
