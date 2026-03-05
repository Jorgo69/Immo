import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { UserModel } from '../../auth/models/user.model/user.model';
import { PaymentGatewayEntity, PaymentGatewayType } from '../entities/payment-gateway.entity';
import { PaymentStrategy } from './payment-strategy.interface';
import { FedaPayStrategy } from './strategies/fedapay.strategy';
import { KKiapyaStrategy } from './strategies/kkiapya.strategy';
import { GsmMockStrategy } from './strategies/gsm-mock.strategy';
import { RecordTransactionCommand } from '../../wallet/commands/impl/record-transaction.command/record-transaction.command';
import { TransactionEntity, TransactionType } from '../../wallet/entities/transaction.entity';
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
    @InjectRepository(UserModel)
    private readonly userRepo: Repository<UserModel>,
    private readonly commandBus: CommandBus,
    private readonly moduleRef: ModuleRef, 
    private readonly notificationService: NotificationService, 
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
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
   * Fusionne la config de la base de données avec les clés sensibles du .env
   */
  private mergeGatewayConfig(gateway: PaymentGatewayEntity): any {
    const baseConfig = gateway.config || {};
    const type = gateway.type.toLowerCase();
    
    // Récupérer les clés depuis ConfigService (qui lit le .env)
    const envConfig = this.configService.get(type) || {};

    return {
      ...baseConfig,
      ...envConfig, // Les clés du .env écrasent celles de la DB pour la sécurité
      isTestMode: gateway.isTestMode,
    };
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

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const config = this.mergeGatewayConfig(gateway);
    
    config.user = {
      firstname: user?.first_name || '',
      lastname: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone_number || ''
    };
    config.appUrl = this.configService.get('app.frontendUrl');

    this.logger.log(`Initializing ${gateway.type} payment for user ${userId}: ${amount} XOF (Env: ${config.mode})`);
    
    const { url, externalId } = await strategy.createPayment(userId, amount, description, config);
    
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

    const strategy = this.strategies[type];
    if (!strategy) {
      this.logger.error(`No strategy found for gateway type: ${type}`);
      return false;
    }

    const config = this.mergeGatewayConfig(gateway);
    const result = await strategy.handleWebhook(payload, config) as any;

    if (result.success) {
      return this.creditWallet(result, type, payload);
    }

    return false;
  }

  /**
   * Réconciliation : Vérifie le statut d'une transaction directement auprès de l'agrégateur.
   * Appelé après le retour de l'utilisateur sur le frontend.
   * Protégé contre les doublons via gateway_ref.
   */
  async verifyAndReconcile(userId: string, gatewayType: string, transactionId: string): Promise<{ verified: boolean, amount: number, alreadyCredited: boolean }> {
    const type = (gatewayType || '').toUpperCase() as PaymentGatewayType;
    const gateway = await this.gatewayRepo.findOne({ where: { type, isActive: true } });
    if (!gateway) {
      this.logger.error(`Reconciliation: unknown gateway ${gatewayType}`);
      return { verified: false, amount: 0, alreadyCredited: false };
    }

    const strategy = this.strategies[type];
    if (!strategy) {
      return { verified: false, amount: 0, alreadyCredited: false };
    }

    // Anti-doublon : vérifier si cette transaction a déjà été créditée
    const txRepo = this.dataSource.getRepository(TransactionEntity);
    const existingTx = await txRepo.findOne({ where: { gateway_ref: transactionId } });
    if (existingTx) {
      this.logger.log(`Reconciliation: Transaction ${transactionId} already credited`);
      return { verified: true, amount: parseFloat(existingTx.amount), alreadyCredited: true };
    }

    // Interroger l'agrégateur pour le vrai statut
    const config = this.mergeGatewayConfig(gateway);
    const result = await strategy.verifyTransaction(transactionId, config);

    this.logger.log(`Reconciliation: ${type} #${transactionId} => success=${result.success}, amount=${result.amount}`);

    if (result.success && result.amount > 0) {
      // Créditer le wallet
      await this.creditWallet({ ...result, userId: result.userId || userId }, type);
      return { verified: true, amount: result.amount, alreadyCredited: false };
    }

    return { verified: false, amount: 0, alreadyCredited: false };
  }

  /**
   * Méthode interne : crédite le wallet et envoie une notification.
   */
  private async creditWallet(result: any, type: PaymentGatewayType, payload?: any): Promise<boolean> {
    const { externalId, amount, userId, currency } = result;
    const resolvedUserId = userId || payload?.custom_metadata?.user_id || payload?.userId;
    
    this.logger.log(`Payment approved via ${type}: ${amount} (Ref: ${externalId})`);
    
    const command = new RecordTransactionCommand();
    command.userId = resolvedUserId; 
    command.amount = amount;
    command.type = TransactionType.SAVING;
    command.gateway_ref = externalId;
    command.currency = currency || 'XOF';

    await this.commandBus.execute(command);

    if (resolvedUserId) {
      const displayCurrency = currency || 'XOF';
      await this.notificationService.notify(resolvedUserId, {
        title_fr: 'Dépôt réussi !',
        title_en: 'Deposit successful!',
        message_fr: `Votre dépôt de ${amount} ${displayCurrency} a été validé. Votre tirelire a été rechargée.`,
        message_en: `Your deposit of ${amount} ${displayCurrency} has been validated. Your wallet has been topped up.`,
        type: NotificationType.SUCCESS,
        metadata: { 
          transactionId: externalId, 
          amount, 
          currency: displayCurrency,
          msgKey: 'deposit_success'
        }
      });
    }

    return true;
  }
}
