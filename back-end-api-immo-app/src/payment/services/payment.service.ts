import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentGatewayEntity, PaymentGatewayType } from '../entities/payment-gateway.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { FedaPayStrategy } from './strategies/fedapay.strategy';
import { KKiapyaStrategy } from './strategies/kkiapya.strategy';
import { GsmMockStrategy } from './strategies/gsm-mock.strategy';
import { RecordTransactionCommand } from '../../wallet/commands/impl/record-transaction.command/record-transaction.command';
import { TransactionType } from '../../wallet/entities/transaction.entity';
import { ModuleRef } from '@nestjs/core';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../notification/entities/notification.entity';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private readonly strategies: Record<PaymentGatewayType, PaymentStrategy> = {
    [PaymentGatewayType.FEDAPAY]: new FedaPayStrategy(),
    [PaymentGatewayType.KKIAPYA]: new KKiapyaStrategy(),
    [PaymentGatewayType.GSM_MTN]: new GsmMockStrategy(),
    [PaymentGatewayType.GSM_MOOV]: new GsmMockStrategy(),
    [PaymentGatewayType.GSM_CELTIS]: new GsmMockStrategy(),
  };

  constructor(
    @InjectRepository(PaymentGatewayEntity)
    private readonly gatewayRepo: Repository<PaymentGatewayEntity>,
    private readonly commandBus: CommandBus,
    private readonly moduleRef: ModuleRef, // Injected ModuleRef
    private readonly notificationService: NotificationService, // Injected NotificationService
  ) {}

  async onModuleInit() {
    await this.seedGateways();
  }

  private async seedGateways() {
    const defaultGateways = [
      { name: 'FedaPay (MTN/Moov)', type: PaymentGatewayType.FEDAPAY },
      { name: 'KKiapya', type: PaymentGatewayType.KKIAPYA },
      { name: 'MTN Mobile Money (Direct)', type: PaymentGatewayType.GSM_MTN },
      { name: 'Moov Money (Direct)', type: PaymentGatewayType.GSM_MOOV },
      { name: 'Celtis Cash (Direct)', type: PaymentGatewayType.GSM_CELTIS },
    ];

    for (const g of defaultGateways) {
      const exists = await this.gatewayRepo.findOne({ where: { type: g.type } });
      if (!exists) {
        const newG = this.gatewayRepo.create({
          ...g,
          isActive: true,
          isTestMode: true,
          config: {},
        });
        await this.gatewayRepo.save(newG);
        this.logger.log(`Seeded gateway: ${g.name}`);
      }
    }
  }

  /**
   * Liste les passerelles de paiement actives pour l'utilisateur.
   */
  async getActiveGateways(): Promise<PaymentGatewayEntity[]> {
    return this.gatewayRepo.find({ where: { isActive: true } });
  }

  /**
   * Initialise un paiement avec une passerelle spécifique.
   */
  async createPayment(userId: string, gatewayId: string, amount: number, description: string): Promise<string> {
    const gateway = await this.gatewayRepo.findOne({ where: { id: gatewayId, isActive: true } });
    if (!gateway) throw new NotFoundException('Passerelle de paiement introuvable ou inactive');

    const strategy = this.strategies[gateway.type];
    if (!strategy) throw new BadRequestException('Stratégie de paiement non supportée');

    this.logger.log(`Initializing ${gateway.type} payment for user ${userId}: ${amount} XOF`);
    
    const { url, externalId } = await strategy.createPayment(userId, amount, description, gateway.config);
    
    // On pourrait stocker la transaction temporaire ici si besoin de suivi strict
    return url;
  }

  /**
   * Traite le Webhook pour une passerelle spécifique.
   */
  async handleWebhook(gatewayType: string, payload: any): Promise<boolean> {
    const type = (gatewayType || '').toUpperCase() as PaymentGatewayType;
    const gateway = await this.gatewayRepo.findOne({ where: { type, isActive: true } });
    if (!gateway) {
      this.logger.error(`Webhook received for inactive or unknown gateway: ${gatewayType}`);
      return false;
    }

    // Exécuter la stratégie correspondante
    const strategy = this.strategies[type];
    if (!strategy) {
      this.logger.error(`No strategy found for gateway type: ${type}`);
      return false;
    }

    const result = await strategy.handleWebhook(payload, gateway.config) as any;

    if (result.success) {
      const { externalId, amount, userId, currency } = result;
      this.logger.log(`Payment approved via ${type}: ${amount} (Ref: ${externalId})`);
      
      const command = new RecordTransactionCommand();
      command.userId = userId || payload.custom_metadata?.user_id || payload.userId; 
      command.amount = amount;
      command.type = TransactionType.SAVING;
      command.gateway_ref = externalId;

      await this.commandBus.execute(command);

      // Envoyer une notification à l'utilisateur
      if (command.userId) {
        await this.notificationService.notify(command.userId, {
          title_fr: 'Dépôt réussi !',
          title_en: 'Deposit successful!',
          message_fr: `Votre dépôt de ${amount} ${currency || 'XOF'} a été validé. Votre tirelire a été rechargée.`,
          message_en: `Your deposit of ${amount} ${currency || 'XOF'} has been validated. Your wallet has been topped up.`,
          type: NotificationType.SUCCESS,
          metadata: { transactionId: externalId, amount, currency: currency || 'XOF' }
        });
      }

      return true;
    }

    return false;
  }
}
