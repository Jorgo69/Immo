import { BadRequestException } from '@nestjs/common';
import { PaymentStrategy } from '../payment-strategy.interface';
import { FedaPay, Transaction } from 'fedapay';

/**
 * Stratégie FedaPay (Bénin) - Implémentation Réelle.
 */
export class FedaPayStrategy implements PaymentStrategy {
  async createPayment(userId: string, amount: number, description: string, config: any): Promise<{ url: string, externalId: string }> {
    const isTest = config?.isTestMode ?? true;
    const secretKey = config?.secretKey; // Récupéré de l'entité PaymentGateway (config JSON)
    
    if (!secretKey) {
      throw new Error('FedaPay Secret Key non configurée');
    }

    FedaPay.setApiKey(secretKey);
    FedaPay.setEnvironment(isTest ? 'sandbox' : 'live');

    const callbackUrl = config?.appUrl 
      ? `${config.appUrl}/admin/profile?payment_status=success` 
      : 'https://immo-benin.local/admin/profile?payment_status=success';

    try {
      // Pré-remplir les infos client si disponibles (l'utilisateur peut les modifier sur le formulaire FedaPay)
      // NB : Le téléphone est exclu volontairement car FedaPay exige un format strict qui causait des erreurs 400
      const customerData: any = {};
      if (config?.user?.email) customerData.email = config.user.email;
      if (config?.user?.firstname) customerData.firstname = config.user.firstname;
      if (config?.user?.lastname) customerData.lastname = config.user.lastname;

      const transaction = await Transaction.create({
        description,
        amount,
        currency: { iso: 'XOF' },
        callback_url: callbackUrl,
        custom_metadata: { user_id: userId },
        ...(Object.keys(customerData).length > 0 ? { customer: customerData } : {}),
      });

      const token = await transaction.generateToken();

      return { 
        url: token.url, 
        externalId: transaction.id.toString() 
      };
    } catch (error: any) {
      const responseData = error.response?.data || {};
      let errorMessage = 'Erreur lors de la création de la transaction FedaPay';
      
      if (responseData.message) {
        errorMessage = responseData.message;
        if (responseData.errors) {
          // Extraire le premier message d'erreur détaillé
          const firstErrorKey = Object.keys(responseData.errors)[0];
          if (firstErrorKey) {
            errorMessage += `: ${responseData.errors[firstErrorKey][0]}`;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('FedaPay CreateTransaction Error:', responseData || error.message);
      throw new BadRequestException(errorMessage);
    }
  }

  async handleWebhook(payload: any, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }> {
    const event = payload.event;
    const transaction = payload.entity;

    const success = event === 'transaction.approved' || transaction?.status === 'approved';
    
    return {
      success,
      externalId: transaction?.id?.toString() || payload.id?.toString(),
      amount: transaction?.amount || payload.amount,
      userId: transaction?.custom_metadata?.user_id || payload.userId,
      currency: transaction?.currency?.iso || 'XOF',
    };
  }

  /**
   * Réconciliation : interroger FedaPay pour vérifier le vrai statut d'une transaction.
   */
  async verifyTransaction(transactionId: string, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }> {
    const isTest = config?.isTestMode ?? true;
    const secretKey = config?.secretKey;
    
    if (!secretKey) {
      throw new BadRequestException('FedaPay Secret Key non configurée');
    }

    FedaPay.setApiKey(secretKey);
    FedaPay.setEnvironment(isTest ? 'sandbox' : 'live');

    try {
      const transaction = await Transaction.retrieve(parseInt(transactionId));
      const status = (transaction as any).status;
      
      console.log(`FedaPay verifyTransaction #${transactionId}: status=${status}`);

      return {
        success: status === 'approved',
        externalId: transactionId,
        amount: (transaction as any).amount || 0,
        userId: (transaction as any).custom_metadata?.user_id,
        currency: (transaction as any).currency?.iso || 'XOF',
      };
    } catch (error: any) {
      console.error('FedaPay verifyTransaction Error:', error.message);
      return { success: false, externalId: transactionId, amount: 0 };
    }
  }
}
