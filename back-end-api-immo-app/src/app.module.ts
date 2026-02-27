/**
 * App Module - Standard 41DEVS
 */
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Modules
import { EncryptionModule } from './common/encryption/encryption.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { WalletModule } from './wallet/wallet.module';
import { PropertyModule } from './property/property.module';
import { ProfileModule } from './profile/profile.module';
import { LocationModule } from './location/location.module';
import { ReferencesModule } from './references/references.module';
import { RentalModule } from './rental/rental.module';
import { CurrencyModule } from './currency/currency.module';

// Entités TypeORM
import { UserModel } from './auth/models/user.model/user.model';
import { WalletEntity } from './wallet/entities/wallet.entity';
import { TransactionEntity } from './wallet/entities/transaction.entity';
import { PropertyEntity } from './property/entities/property.entity';
import { MediaEntity } from './property/entities/media.entity';
import { UnitEntity } from './property/entities/unit.entity';
import { CountryEntity } from './location/entities/country.entity';
import { CityEntity } from './location/entities/city.entity';
import { NeighborhoodEntity } from './location/entities/neighborhood.entity';
import { ProfileEntity } from './profile/entities/profile.entity';
import { PaymentMethodEntity } from './profile/entities/payment-method.entity';
import { PropertyTypeEntity } from './references/entities/property-type.entity';
import { PropertyStatusEntity } from './references/entities/property-status.entity';
import { UnitTypeEntity } from './references/entities/unit-type.entity';
import { UnitFeatureEntity } from './references/entities/unit-feature.entity';
import { RefCategoryEntity } from './references/entities/ref-category.entity';
import { RefTypeEntity } from './references/entities/ref-type.entity';
import { RefFeatureEntity } from './references/entities/ref-feature.entity';
import { RentalRequestEntity } from './rental/entities/rental-request.entity';
import { CurrencyRateEntity } from './currency/entities/currency-rate.entity';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AuditModule } from './audit/audit.module';
import { ActivityLogEntity } from './audit/entities/activity-log.entity';
import { AuditInterceptor } from './audit/interceptors/audit.interceptor';
import { SettingsModule } from './settings/settings.module';
import { SystemConfigEntity } from './settings/entities/system-config.entity';
import { NotificationPreferenceEntity } from './settings/entities/notification-preference.entity';
import { RoleEntity } from './rbac/entities/role.entity';
import { PermissionEntity } from './rbac/entities/permission.entity';
import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Configuration YAML
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),

    // TypeORM avec configuration async
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [UserModel, WalletEntity, TransactionEntity, PropertyEntity, MediaEntity, UnitEntity, CountryEntity, CityEntity, NeighborhoodEntity, ProfileEntity, PaymentMethodEntity, PropertyTypeEntity, PropertyStatusEntity, UnitTypeEntity, UnitFeatureEntity, RefCategoryEntity, RefTypeEntity, RefFeatureEntity, RentalRequestEntity, CurrencyRateEntity, ActivityLogEntity, SystemConfigEntity, NotificationPreferenceEntity, RoleEntity, PermissionEntity],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
      }),
      inject: [ConfigService],
    }),

    // Modules métier
    EncryptionModule,
    RedisModule,
    AuthModule,
    UserModule,
    WalletModule,
    PropertyModule,
    ProfileModule,
    LocationModule,
    ReferencesModule,
    RentalModule,
    CurrencyModule,
    HealthModule,
    OnboardingModule,
    AuditModule,
    SettingsModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
