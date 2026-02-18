/**
 * Commande : obtenir le wallet de l'utilisateur connecté, le créer si absent.
 */
export class GetOrCreateWalletCommand {
  userId: string; // Renseigné depuis le JWT dans le controller
}
