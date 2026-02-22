/**
 * Commande : refuser une demande de location (propriétaire).
 */
export class RejectRentalRequestCommand {
  request_id: string;
  responded_by: string;
}
