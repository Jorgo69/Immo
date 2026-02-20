import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileEntity } from './entities/profile.entity';
import { PaymentMethodEntity } from './entities/payment-method.entity';
import { UserModel } from '../auth/models/user.model/user.model';
import { UpdateProfileHandler } from './commands/handlers/update-profile.handler/update-profile.handler';
import { AddPaymentMethodHandler } from './commands/handlers/add-payment-method.handler/add-payment-method.handler';
import { GetProfileByUserHandler } from './queries/handlers/get-profile-by-user.handler/get-profile-by-user.handler';
import { GetPaymentMethodsHandler } from './queries/handlers/get-payment-methods.handler/get-payment-methods.handler';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([ProfileEntity, PaymentMethodEntity, UserModel])],
  controllers: [ProfileController],
  providers: [
    UpdateProfileHandler,
    AddPaymentMethodHandler,
    GetProfileByUserHandler,
    GetPaymentMethodsHandler,
  ],
})
export class ProfileModule {}
