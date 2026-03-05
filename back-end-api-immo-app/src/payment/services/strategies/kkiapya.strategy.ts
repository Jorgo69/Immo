import { BadRequestException } from '@nestjs/common';
import { PaymentStrategy } from '../payment-strategy.interface';
const { kkiapay } = require('@kkiapay-org/nodejs-sdk');

/**
 * Stratégie KKiapya (Bénin) - Implémentation Réelle.
 */
export class KKiapyaStrategy implements PaymentStrategy {
  async createPayment(userId: string, amount: number, description: string, config: any): Promise<{ url: string, externalId: string }> {
    const publicKey = config?.publicKey;
    const isSandbox = config?.isTestMode ?? true;
    
    if (!publicKey) {
      throw new BadRequestException('KKiapya Public Key non configurée');
    }

    // Kkiapay fonctionne exclusivement via un SDK JS côté navigateur (openKkiapayWidget).
    // Le backend ne peut PAS générer un lien hébergé.  
    // On retourne les paramètres sous forme d'URL spéciale que le frontend va intercepter.
    const widgetParams: Record<string, any> = {
      amount,
      key: publicKey,
      sandbox: isSandbox,
      reason: description,
      data: JSON.stringify({ userId }),
    };

    // Pré-remplir les infos utilisateur si disponibles (modifiables par l'utilisateur sur le widget)
    const fullName = [config?.user?.firstname, config?.user?.lastname].filter(Boolean).join(' ');
    if (fullName) widgetParams.name = fullName;
    if (config?.user?.email) widgetParams.email = config.user.email;

    // URL spéciale : le frontend détectera le préfixe "kkiapay://" et ouvrira le widget JS
    const url = `kkiapay://widget?params=${encodeURIComponent(JSON.stringify(widgetParams))}`;
    const externalId = `kki_pending_${Date.now()}`; 

    return { url, externalId };
  }

  async handleWebhook(payload: any, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }> {
    const privateKey = config?.privateKey;
    const publicKey = config?.publicKey;
    const secretKey = config?.secretKey;
    const isSandbox = config?.isTestMode ?? true;

    if (!privateKey || !publicKey || !secretKey) {
      throw new Error('KKiapya API Keys manquantes pour la vérification');
    }

    // Initialisation via le SDK officiel
    const k = kkiapay({
      publickey: publicKey,
      privatekey: privateKey,
      secretkey: secretKey,
      sandbox: isSandbox,
    });

    try {
      const transactionId = payload.transactionId || payload.transaction_id;
      if (!transactionId) return { success: false, externalId: '', amount: 0 };

      const transaction = await k.verify(transactionId);
      
      return {
        success: transaction.status === 'SUCCESS',
        externalId: transaction.transactionId || transaction.transaction_id,
        amount: transaction.amount,
        userId: transaction.custom_metadata?.userId || (payload.data ? JSON.parse(payload.data).userId : null),
        currency: 'XOF',
      };
    } catch (error) {
      console.error('Erreur vérification KKiapya:', error);
      return { success: false, externalId: '', amount: 0 };
    }
  }

  /**
   * Réconciliation : interroger Kkiapay pour vérifier le vrai statut d'une transaction.
   */
  async verifyTransaction(transactionId: string, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }> {
    const privateKey = config?.privateKey;
    const publicKey = config?.publicKey;
    const secretKey = config?.secretKey;
    const isSandbox = config?.isTestMode ?? true;

    if (!privateKey || !publicKey || !secretKey) {
      throw new Error('KKiapya API Keys manquantes pour la vérification');
    }

    const k = kkiapay({
      publickey: publicKey,
      privatekey: privateKey,
      secretkey: secretKey,
      sandbox: isSandbox,
    });

    try {
      const transaction = await k.verify(transactionId);
      console.log(`KKiapya verifyTransaction #${transactionId}: status=${transaction?.status}`);
      
      return {
        success: transaction?.status === 'SUCCESS',
        externalId: transaction?.transactionId || transactionId,
        amount: transaction?.amount || 0,
        userId: transaction?.custom_metadata?.userId,
        currency: 'XOF',
      };
    } catch (error) {
      console.error('Erreur verifyTransaction KKiapya:', error);
      return { success: false, externalId: transactionId, amount: 0 };
    }
  }
}
