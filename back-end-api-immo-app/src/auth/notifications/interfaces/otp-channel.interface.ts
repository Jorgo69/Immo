/**
 * Contexte optionnel pour l'envoi OTP (email pour le canal email).
 */
export interface OtpSendContext {
  email?: string;
}

/**
 * Résultat possible après envoi (ex: lien WhatsApp à afficher côté front).
 */
export interface OtpSendResult {
  whatsapp_link?: string;
}

/**
 * Interface commune pour un canal d'envoi OTP (SMS, Email, WhatsApp manuel).
 * Chaque provider peut utiliser phone et/ou context.email.
 */
export interface IOtpChannelProvider {
  readonly channel: 'email' | 'whatsapp' | 'sms';

  /**
   * Envoie le code OTP (ou prépare le lien pour WhatsApp).
   * @param phone Numéro E.164
   * @param code Code OTP à 6 chiffres
   * @param context Email si canal email, etc.
   */
  sendOtp(
    phone: string,
    code: string,
    context?: OtpSendContext,
  ): Promise<OtpSendResult>;

  /** Indique si le provider est actif (config + credentials). */
  isEnabled(): boolean;
}
