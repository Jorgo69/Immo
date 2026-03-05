import { PaymentStrategy } from '../payment-strategy.interface';

/**
 * Stratégie Mock pour intégration directe GSM (MTN, Moov, Celtis).
 * Utile pour les tests et les futures intégrations directes sans agrégateur.
 */
export class GsmMockStrategy implements PaymentStrategy {
  async createPayment(userId: string, amount: number, description: string, config: any): Promise<{ url: string, externalId: string }> {
    const externalId = `gsm_direct_${Date.now()}`;
    // Simulation d'une redirection vers notre simulateur local
    const url = `/payment/mock?id=${externalId}&amount=${amount}&gateway=GSM`;
    
    return { url, externalId };
  }

  async handleWebhook(payload: any, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }> {
    // Simulation de confirmation directe
    return {
      success: true,
      externalId: payload.id,
      amount: payload.amount,
      userId: payload.userId,
      currency: payload.currency || 'XOF',
    };
  }

  async verifyTransaction(transactionId: string, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }> {
    // Mock : pas de vérification réelle pour les passerelles GSM directes
    return { success: false, externalId: transactionId, amount: 0 };
  }
}
