/**
 * Interface de base pour toutes les passerelles de paiement.
 */
export interface PaymentStrategy {
  /**
   * Créer un lien de paiement ou initier la transaction.
   */
  createPayment(userId: string, amount: number, description: string, config: any): Promise<{ url: string, externalId: string }>;

  /**
   * Vérifier et traiter un webhook de confirmation.
   */
  handleWebhook(payload: any, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }>;

  /**
   * Vérifier directement le statut d'une transaction auprès de l'agrégateur (Réconciliation).
   * Appelé après le retour de l'utilisateur pour confirmer le paiement sans attendre le webhook.
   */
  verifyTransaction(transactionId: string, config: any): Promise<{ success: boolean, externalId: string, amount: number, userId?: string, currency?: string }>;
}

