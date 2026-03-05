/**
 * Handler : Paye un loyer — débit ACID du wallet locataire, crédit du wallet propriétaire.
 */
import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { BadRequestException, Logger } from '@nestjs/common';
import { PayRentCommand } from '../../impl/pay-rent.command/pay-rent.command';
import { WalletEntity } from '../../../entities/wallet.entity';
import { TransactionEntity, TransactionStatus, TransactionType } from '../../../entities/transaction.entity';
import { InvoiceEntity, InvoiceStatus } from '../../../entities/invoice.entity';
import { NotificationService } from '../../../../notification/services/notification.service';
import { NotificationType } from '../../../../notification/entities/notification.entity';

@CommandHandler(PayRentCommand)
export class PayRentHandler implements ICommandHandler<PayRentCommand> {
  private readonly logger = new Logger(PayRentHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: PayRentCommand): Promise<{ success: boolean, transactionId: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const walletRepo = queryRunner.manager.getRepository(WalletEntity);
      const txRepo = queryRunner.manager.getRepository(TransactionEntity);
      const invoiceRepo = queryRunner.manager.getRepository(InvoiceEntity);

      // 1. Récupérer le wallet du locataire
      const tenantWallet = await walletRepo.findOne({ where: { user_id: command.tenantId } });
      if (!tenantWallet) {
        throw new BadRequestException('Wallet du locataire introuvable.');
      }

      // 2. Vérifier le solde suffisant (on débite depuis balance_savings = tirelire)
      const tenantSavings = parseFloat(tenantWallet.balance_savings);
      if (tenantSavings < command.amount) {
        throw new BadRequestException(
          `Solde insuffisant. Votre tirelire contient ${tenantSavings} ${command.currency}, le loyer est de ${command.amount} ${command.currency}.`
        );
      }

      // 3. Récupérer ou créer le wallet du propriétaire
      let landlordWallet = await walletRepo.findOne({ where: { user_id: command.landlordId } });
      if (!landlordWallet) {
        landlordWallet = walletRepo.create({
          user_id: command.landlordId,
          balance_total: '0',
          balance_savings: '0',
        });
        landlordWallet = await walletRepo.save(landlordWallet);
      }

      // 4. Débiter le locataire
      tenantWallet.balance_savings = String(tenantSavings - command.amount);
      tenantWallet.balance_total = String(parseFloat(tenantWallet.balance_total) - command.amount);
      await walletRepo.save(tenantWallet);

      // 5. Créditer le propriétaire
      landlordWallet.balance_total = String(parseFloat(landlordWallet.balance_total) + command.amount);
      await walletRepo.save(landlordWallet);

      // 6. Créer la transaction de débit (locataire)
      const debitTx = txRepo.create({
        wallet_id: tenantWallet.id,
        amount: String(-command.amount), // négatif = débit
        type: TransactionType.RENT,
        status: TransactionStatus.COMPLETED,
        gateway_ref: `rent_${command.invoiceId}`,
        currency: command.currency,
      });
      const savedDebitTx = await txRepo.save(debitTx);

      // 7. Créer la transaction de crédit (propriétaire)
      const creditTx = txRepo.create({
        wallet_id: landlordWallet.id,
        amount: String(command.amount), // positif = crédit
        type: TransactionType.RENT,
        status: TransactionStatus.COMPLETED,
        gateway_ref: `rent_${command.invoiceId}`,
        currency: command.currency,
      });
      await txRepo.save(creditTx);

      // 8. Marquer la facture comme payée
      const invoice = await invoiceRepo.findOne({ where: { id: command.invoiceId } });
      if (invoice) {
        invoice.status = InvoiceStatus.PAID;
        invoice.paid_at = new Date();
        await invoiceRepo.save(invoice);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Loyer payé: ${command.amount} ${command.currency} (Locataire ${command.tenantId} → Propriétaire ${command.landlordId})`);

      // 9. Notifications (hors transaction pour ne pas bloquer)
      await this.sendNotifications(command);

      return { success: true, transactionId: savedDebitTx.id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Erreur paiement loyer: ${error instanceof Error ? error.message : error}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async sendNotifications(command: PayRentCommand) {
    // Notification au locataire
    await this.notificationService.notify(command.tenantId, {
      title_fr: 'Loyer payé',
      title_en: 'Rent paid',
      message_fr: `Votre loyer de ${command.amount} ${command.currency} a été prélevé de votre tirelire.`,
      message_en: `Your rent of ${command.amount} ${command.currency} has been deducted from your wallet.`,
      type: NotificationType.SUCCESS,
      metadata: { invoiceId: command.invoiceId, leaseId: command.leaseId, amount: command.amount },
    });

    // Notification au propriétaire
    await this.notificationService.notify(command.landlordId, {
      title_fr: 'Loyer reçu',
      title_en: 'Rent received',
      message_fr: `Vous avez reçu un paiement de loyer de ${command.amount} ${command.currency}.`,
      message_en: `You received a rent payment of ${command.amount} ${command.currency}.`,
      type: NotificationType.SUCCESS,
      metadata: { invoiceId: command.invoiceId, leaseId: command.leaseId, amount: command.amount },
    });
  }
}
