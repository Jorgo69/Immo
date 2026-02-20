import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ForbiddenException, Logger } from '@nestjs/common';
import { AddPaymentMethodCommand } from '../../impl/add-payment-method.command/add-payment-method.command';
import { PaymentMethodEntity } from '../../../entities/payment-method.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { EncryptionService } from '../../../../common/encryption/encryption.service';
import { PaymentMethodDisplayDto } from '../../../queries/handlers/get-payment-methods.handler/get-payment-methods.handler';

@CommandHandler(AddPaymentMethodCommand)
export class AddPaymentMethodHandler implements ICommandHandler<AddPaymentMethodCommand> {
  private readonly logger = new Logger(AddPaymentMethodHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(command: AddPaymentMethodCommand): Promise<PaymentMethodDisplayDto> {
    const userRepo = this.dataSource.getRepository(UserModel);
    const user = await userRepo.findOne({
      where: { id: command.userId },
      select: ['id', 'encryption_salt'],
    });
    if (!user?.encryption_salt) {
      throw new ForbiddenException('Profil non configuré pour les paiements');
    }

    const repo = this.dataSource.getRepository(PaymentMethodEntity);
    const entity = repo.create({
      user_id: command.userId,
      type: command.type,
      gateway_token_enc: this.encryption.encrypt(command.gateway_token, user.encryption_salt),
      last4_enc: command.last4 ? this.encryption.encrypt(command.last4.slice(-4), user.encryption_salt) : null,
      brand_enc: command.brand ? this.encryption.encrypt(command.brand, user.encryption_salt) : null,
    });
    const saved = await repo.save(entity);

    let last4_display = '****';
    let brand_display = command.brand ?? (command.type === 'mobile_money' ? 'Mobile Money' : 'Carte');
    if (command.last4) last4_display = '****' + command.last4.slice(-4);

    return {
      id: saved.id,
      type: saved.type,
      last4_display,
      brand_display,
    };
  }
}
