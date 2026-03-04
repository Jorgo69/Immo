import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { PushSubscriptionEntity } from './entities/push-subscription.entity';
import { UserModel } from '../auth/models/user.model/user.model';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      PushSubscriptionEntity,
      UserModel,
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
