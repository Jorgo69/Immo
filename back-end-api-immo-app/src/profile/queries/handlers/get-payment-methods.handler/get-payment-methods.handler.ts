import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetPaymentMethodsQuery } from '../../impl/get-payment-methods.query/get-payment-methods.query';
import { PaymentMethodEntity } from '../../../entities/payment-method.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';

export interface PaymentMethodDisplayDto {
  id: string;
  type: string;
  last4_display: string;
  brand_display: string;
}

@QueryHandler(GetPaymentMethodsQuery)
export class GetPaymentMethodsHandler implements IQueryHandler<GetPaymentMethodsQuery> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(query: GetPaymentMethodsQuery): Promise<PaymentMethodDisplayDto[]> {
    const user = await this.dataSource.getRepository(UserModel).findOne({
      where: { id: query.userId },
      select: ['id', 'encryption_salt'],
    });
    if (!user?.encryption_salt) return [];

    const methods = await this.dataSource.getRepository(PaymentMethodEntity).find({
      where: { user_id: query.userId },
      order: { created_at: 'DESC' },
    });

    const result: PaymentMethodDisplayDto[] = [];
    for (const m of methods) {
      let last4_display = '****';
      let brand_display = '';
      try {
        if (m.last4_enc && this.encryption.isConfigured()) {
          last4_display = '****' + this.encryption.decrypt(m.last4_enc, user.encryption_salt);
        }
        if (m.brand_enc && this.encryption.isConfigured()) {
          brand_display = this.encryption.decrypt(m.brand_enc, user.encryption_salt);
        }
      } catch {
        last4_display = '****';
      }
      result.push({
        id: m.id,
        type: m.type,
        last4_display,
        brand_display: brand_display || (m.type === 'mobile_money' ? 'Mobile Money' : 'Carte'),
      });
    }
    return result;
  }
}
