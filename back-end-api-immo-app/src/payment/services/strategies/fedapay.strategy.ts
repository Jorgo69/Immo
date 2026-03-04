import { PaymentStrategy } from '../payment-strategy.interface';

/**
 * Stratégie FedaPay (Bénin).
 */
export class FedaPayStrategy implements PaymentStrategy {
  async createPayment(userId: string, amount: number, description: string, config: any): Promise<{ url: string, externalId: string }> {
    const isTest = config?.isTestMode ?? true;
    const externalId = `fedapay_${Date.now()}`;
    
    // Simulation du lien FedaPay : redirection vers notre simulateur local si en mode test
    const url = isTest 
      ? `/payment/mock?id=${externalId}&amount=${amount}&gateway=FedaPay`
      : `https://checkout.fedapay.com/pay/${externalId}?amount=${amount}&currency=XOF`;
    
    return { url, externalId };
  }

  async handleWebhook(payload: any, config: any): Promise<{ success: boolean, externalId: string, amount: number }> {
    // Dans une vraie implé, on vérifierait la signature avec config.secretKey
    const success = payload.status === 'approved';
    return {
      success,
      externalId: payload.reference,
      amount: payload.amount,
    };
  }
}
