/**
 * Commande : accepter une demande de location (propriétaire).
 * Passe l'unité en OCCUPIED et rejette les autres demandes en attente pour cette unité.
 */
export class AcceptRentalRequestCommand {
  request_id: string;
  responded_by: string;
}
