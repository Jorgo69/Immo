import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan } from 'typeorm';
import { LeaseEntity, LeaseStatus } from '../entities/lease.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../notification/entities/notification.entity';
import { InvoiceEntity, InvoiceStatus } from '../../wallet/entities/invoice.entity';
import { ReputationService } from '../../profile/services/reputation.service';
import { CommandBus } from '@nestjs/cqrs';
import { WalletEntity } from '../../wallet/entities/wallet.entity';
import { PayRentCommand } from '../../wallet/commands/impl/pay-rent.command/pay-rent.command';

@Injectable()
export class LeaseCronService {
  private readonly logger = new Logger(LeaseCronService.name);

  constructor(
    @InjectRepository(LeaseEntity)
    private readonly leaseRepo: Repository<LeaseEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    private readonly notificationService: NotificationService,
    private readonly reputationService: ReputationService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * Exécution quotidienne à minuit pour gérer les loyers.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleLeaseBilling() {
    this.logger.log('Démarrage du cycle de facturation des baux...');
    const now = new Date();

    // 1. Trouver les baux dont la date de facturation est arrivée
    const activeLeases = await this.leaseRepo.find({
      where: {
        status: LeaseStatus.ACTIVE,
        next_billing_date: LessThanOrEqual(now),
      },
      relations: ['tenant', 'property'],
    });

    for (const lease of activeLeases) {
      try {
        await this.processLeasePayment(lease);
      } catch (e) {
        this.logger.error(`Erreur lors du traitement du bail ${lease.id}: ${e.message}`);
      }
    }
  }

  /**
   * Gestion des impayés (Score de réputation).
   * Tourne tous les jours pour pénaliser si retard > 5 jours.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverduePayments() {
    this.logger.log('Vérification des factures impayées...');
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const overdueInvoices = await this.invoiceRepo.find({
      where: {
        status: InvoiceStatus.PENDING,
        due_date: LessThan(fiveDaysAgo),
      },
      relations: ['lease', 'lease.tenant'],
    });

    for (const invoice of overdueInvoices) {
      // Marquer comme OVERDUE si ce n'est pas déjà fait
      invoice.status = InvoiceStatus.OVERDUE;
      await this.invoiceRepo.save(invoice);

      // Pénalité de réputation (-0.5 point)
      await this.reputationService.updateReputationScore(invoice.lease.tenant_id);
      
      this.logger.warn(`Pénalité de réputation appliquée au locataire ${invoice.lease.tenant_id} pour retard de loyer.`);
    }
  }

  /**
   * Rappels de loyer (J-3).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendPaymentReminders() {
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const leasesToRemind = await this.leaseRepo.find({
      where: {
        status: LeaseStatus.ACTIVE,
        next_billing_date: LessThanOrEqual(in3Days),
      },
      relations: ['tenant', 'property'],
    });

    for (const lease of leasesToRemind) {
      await this.notificationService.notify(lease.tenant_id, {
        title_fr: 'Rappel de loyer',
        title_en: 'Rent Reminder',
        message_fr: `Votre loyer pour ${lease.property?.name || 'votre bien'} sera dû dans 3 jours.`,
        message_en: `Your rent for ${lease.property?.name || 'your property'} will be due in 3 days.`,
        type: NotificationType.INFO,
        metadata: { leaseId: lease.id }
      });
    }
  }

  private async processLeasePayment(lease: LeaseEntity) {
    const walletId = await this.getWalletIdForUser(lease.tenant_id);
    
    // 1. Créer la facture (Invoice)
    const invoice = this.invoiceRepo.create({
      lease_id: lease.id,
      wallet_id: walletId || '',
      title: `Loyer - ${lease.property?.name || 'Bien immobiliers'}`,
      amount: lease.monthly_rent,
      status: InvoiceStatus.PENDING,
      due_date: lease.next_billing_date || new Date(),
    });
    await this.invoiceRepo.save(invoice);

    // 2. Débit automatique si activé
    if (lease.auto_debit_enabled && walletId) {
      this.logger.log(`Tentative de débit automatique pour le bail ${lease.id}`);
      try {
        const payCmd = new PayRentCommand();
        payCmd.tenantId = lease.tenant_id;
        payCmd.landlordId = lease.landlord_id;
        payCmd.invoiceId = invoice.id;
        payCmd.leaseId = lease.id;
        payCmd.amount = lease.monthly_rent;
        
        await this.commandBus.execute(payCmd);
        this.logger.log(`Débit automatique réussi pour le bail ${lease.id}`);
      } catch (error) {
        this.logger.warn(`Échec débit automatique pour le bail ${lease.id}: ${error.message}`);
        // Notifier le locataire en cas d'échec du prélèvement auto (ex: solde insuffisant)
        await this.notificationService.notify(lease.tenant_id, {
          title_fr: 'Échec du prélèvement automatique',
          title_en: 'Auto-debit failed',
          message_fr: `Le prélèvement automatique de votre loyer (${lease.monthly_rent} FCFA) a échoué : ${error.message}. Merci de régulariser manuellement.`,
          message_en: `The auto-debit of your rent (${lease.monthly_rent} FCFA) failed: ${error.message}. Please pay manually.`,
          type: NotificationType.CRITICAL,
          metadata: { leaseId: lease.id, invoiceId: invoice.id }
        });
      }
    }

    // 3. Mettre à jour la prochaine date (M+1)
    const nextDate = new Date(lease.next_billing_date || new Date());
    nextDate.setMonth(nextDate.getMonth() + 1);
    lease.next_billing_date = nextDate;
    await this.leaseRepo.save(lease);

    // 4. Notification
    await this.notificationService.notify(lease.tenant_id, {
      title_fr: 'Nouvelle quittance générée',
      title_en: 'New invoice generated',
      message_fr: `Votre loyer de ${lease.monthly_rent} FCFA est dû.`,
      message_en: `Your rent of ${lease.monthly_rent} FCFA is due.`,
      type: NotificationType.WARNING,
      metadata: { invoiceId: invoice.id }
    });
  }

  private async getWalletIdForUser(userId: string): Promise<string | null> {
    const wallet = await this.walletRepo.findOne({ where: { user_id: userId } });
    return wallet ? wallet.id : null;
  }
}
