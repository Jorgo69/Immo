/**
 * Command : Payer un loyer (débit locataire → crédit propriétaire).
 */
export class PayRentCommand {
  tenantId: string;
  landlordId: string;
  invoiceId: string;
  leaseId: string;
  amount: number;
  currency: string = 'XOF';
}
