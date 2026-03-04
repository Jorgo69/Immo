import { PaymentStrategy } from '../payment-strategy.interface';

/**
 * Stratégie KKiapya (Bénin).
 */
export class KKiapyaStrategy implements PaymentStrategy {
  async createPayment(userId: string, amount: number, description: string, config: any): Promise<{ url: string, externalId: string }> {
    const externalId = `kkiapya_${Date.now()}`;
    // Simulation du lien KKiapya vers notre simulateur local
    const url = `/payment/mock?id=${externalId}&amount=${amount}&gateway=KKiapya`;
    
    return { url, externalId };
  }

  async handleWebhook(payload: any, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }> {
    // Simulation KKiapya Webhook
    return {
      success: payload.status === 'SUCCESS',
      externalId: payload.transaction_id,
      amount: payload.amount,
      userId: payload.userId,
      currency: payload.currency || 'XOF',
    };
  }
}
