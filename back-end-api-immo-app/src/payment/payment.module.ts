/**
 * Payment Module — Gestion des paiements Mobile Money.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentAdminController } from './payment-admin.controller';
import { PaymentService } from './services/payment.service';
import { PaymentGatewayEntity } from './entities/payment-gateway.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PaymentGatewayEntity]),
  ],
  controllers: [PaymentController, PaymentAdminController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
