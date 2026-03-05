/**
 * Module Property — biens immobiliers (La Maison), unités (chambres/apparts), médias.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationModule } from '../location/location.module';
import { PropertyController } from './property.controller';
import { LeaseController } from './lease.controller';
import { PropertyEntity } from './entities/property.entity';
import { MediaEntity } from './entities/media.entity';
import { UnitEntity } from './entities/unit.entity';
import { LeaseEntity } from './entities/lease.entity';
import { InvoiceEntity } from '../wallet/entities/invoice.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { NotificationModule } from '../notification/notification.module';
import { ProfileModule } from '../profile/profile.module';
import { WalletModule } from '../wallet/wallet.module';
import { UserModel } from '../auth/models/user.model/user.model';
import { CreatePropertyHandler } from './commands/handlers/create-property.handler/create-property.handler';
import { CreateUnitHandler } from './commands/handlers/create-unit.handler/create-unit.handler';
import { UpdatePropertyHandler } from './commands/handlers/update-property.handler/update-property.handler';
import { UpdateUnitHandler } from './commands/handlers/update-unit.handler/update-unit.handler';
import { AddMediaHandler } from './commands/handlers/add-media.handler/add-media.handler';
import { DeletePropertyHandler } from './commands/handlers/delete-property.handler/delete-property.handler';
import { DeleteUnitHandler } from './commands/handlers/delete-unit.handler/delete-unit.handler';
import { GetPropertyByIdHandler } from './queries/handlers/get-property-by-id.handler/get-property-by-id.handler';
import { GetAllPropertiesHandler } from './queries/handlers/get-all-properties.handler/get-all-properties.handler';
import { GetMediaByPropertyHandler } from './queries/handlers/get-media-by-property.handler/get-media-by-property.handler';
import { SearchPropertiesHandler } from './queries/handlers/search-properties.handler/search-properties.handler';
import { SearchSemanticPropertiesHandler } from './queries/handlers/search-semantic-properties.handler/search-semantic-properties.handler';
import { GetPropertiesByOwnerHandler } from './queries/handlers/get-properties-by-owner.handler/get-properties-by-owner.handler';
import { GetMyLeasesQueryHandler } from './queries/handlers/get-my-leases.query.handler/get-my-leases.query.handler';
import { SemanticSearchService } from './services/semantic-search.service';
import { UploadPropertyImageService } from './services/upload-property-image.service';
import { CreateLeaseCommandHandler } from './commands/handlers/create-lease.command.handler/create-lease.command.handler';
import { SignLeaseCommandHandler } from './commands/handlers/sign-lease.command.handler/sign-lease.command.handler';
import { LeaseCronService } from './services/lease-cron.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PropertyEntity, MediaEntity, UnitEntity, LeaseEntity, InvoiceEntity, UserModel, WalletEntity]),
    LocationModule,
    NotificationModule,
    ProfileModule,
    WalletModule,
  ],
  controllers: [PropertyController, LeaseController],
  providers: [
    UploadPropertyImageService,
    CreatePropertyHandler,
    CreateUnitHandler,
    UpdatePropertyHandler,
    UpdateUnitHandler,
    AddMediaHandler,
    DeletePropertyHandler,
    DeleteUnitHandler,
    GetPropertyByIdHandler,
    GetAllPropertiesHandler,
    GetPropertiesByOwnerHandler,
    GetMediaByPropertyHandler,
    SearchPropertiesHandler,
    SearchSemanticPropertiesHandler,
    SemanticSearchService,
    CreateLeaseCommandHandler,
    SignLeaseCommandHandler,
    GetMyLeasesQueryHandler,
    LeaseCronService,
  ],
})
export class PropertyModule {}
