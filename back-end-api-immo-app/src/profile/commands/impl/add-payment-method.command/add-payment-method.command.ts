import { PaymentMethodType } from '../../../entities/payment-method.entity';

export class AddPaymentMethodCommand {
  userId: string;
  type: PaymentMethodType;
  gateway_token: string;
  last4?: string;
  brand?: string;
}
