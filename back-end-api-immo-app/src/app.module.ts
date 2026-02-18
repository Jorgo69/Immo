/**
 * App Module - Standard 41DEVS
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Modules
import { EncryptionModule } from './common/encryption/encryption.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { WalletModule } from './wallet/wallet.module';
import { PropertyModule } from './property/property.module';
import { ProfileModule } from './profile/profile.module';

// Entités TypeORM
import { UserModel } from './auth/models/user.model/user.model';
import { WalletEntity } from './wallet/entities/wallet.entity';
import { TransactionEntity } from './wallet/entities/transaction.entity';
import { PropertyEntity } from './property/entities/property.entity';
import { MediaEntity } from './property/entities/media.entity';
import { RoomEntity } from './property/entities/room.entity';
import { ProfileEntity } from './profile/entities/profile.entity';

@Module({
  imports: [
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
        entities: [UserModel, WalletEntity, TransactionEntity, PropertyEntity, MediaEntity, RoomEntity, ProfileEntity],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
      }),
      inject: [ConfigService],
    }),

    // Modules métier
    EncryptionModule,
    AuthModule,
    UserModule,
    WalletModule,
    PropertyModule,
    ProfileModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
