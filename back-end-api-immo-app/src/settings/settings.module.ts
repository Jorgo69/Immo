import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SystemConfigEntity } from './entities/system-config.entity';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigEntity, NotificationPreferenceEntity])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
