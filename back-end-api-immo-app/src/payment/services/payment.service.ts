import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class PaymentService {
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

    const strategy = this.strategies[type];
    const { success, externalId, amount } = await strategy.handleWebhook(payload, gateway.config);

    if (success) {
      this.logger.log(`Payment approved via ${type}: ${amount} XOF (Ref: ${externalId})`);
      
      const command = new RecordTransactionCommand();
      // Note: Le userId doit être extrait du payload ou du metadata si la stratégie le permet
      command.userId = payload.custom_metadata?.user_id || payload.userId; 
      command.amount = amount;
      command.type = TransactionType.SAVING;
      command.gateway_ref = externalId;

      await this.commandBus.execute(command);
      return true;
    }

    return false;
  }
}
