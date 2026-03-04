import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { LeaseEntity, LeaseStatus } from '../entities/lease.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../notification/entities/notification.entity';
import { InvoiceEntity, InvoiceStatus } from '../../wallet/entities/invoice.entity';
import { ReputationService } from '../../profile/services/reputation.service';
import { CommandBus } from '@nestjs/cqrs';
// import { RecordTransactionCommand } from '../../wallet/commands/impl/record-transaction.command/record-transaction.command';

@Injectable()
export class LeaseCronService {
  private readonly logger = new Logger(LeaseCronService.name);

  constructor(
    @InjectRepository(LeaseEntity)
    private readonly leaseRepo: Repository<LeaseEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
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
      relations: ['tenant'],
    });

    for (const lease of leasesToRemind) {
      // Éviter de renvoyer si déjà payé pour ce mois (logique simplifiée)
      await this.notificationService.notify(lease.tenant_id, {
        title_fr: 'Rappel de loyer',
        title_en: 'Rent Reminder',
        message_fr: `Votre loyer pour ${lease.property.name} sera dû dans 3 jours.`,
        message_en: `Your rent for ${lease.property.name} will be due in 3 days.`,
        type: NotificationType.INFO,
        metadata: { leaseId: lease.id }
      });
    }
  }

  private async processLeasePayment(lease: LeaseEntity) {
    // 1. Créer la facture (Invoice)
    const invoice = this.invoiceRepo.create({
      lease_id: lease.id,
      wallet_id: (await this.getWalletIdForUser(lease.tenant_id)) || '',
      title: `Loyez - ${lease.property.name}`,
      amount: lease.monthly_rent,
      status: InvoiceStatus.PENDING,
      due_date: lease.next_billing_date || new Date(),
    });
    await this.invoiceRepo.save(invoice);

    // 2. Débit automatique si activé
    if (lease.auto_debit_enabled) {
      // TODO: Appeler RecordTransactionCommand pour débiter le solde savings
      this.logger.log(`Tentative de débit automatique pour le bail ${lease.id}`);
      // await this.commandBus.execute(new RecordTransactionCommand(...));
      // Si réussite -> invoice.status = PAID
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
    // Logique simplifiée pour récupérer le wallet
    return null; // À implémenter avec le repo Wallet
  }
}
