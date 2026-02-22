/**
 * Module Rental — demandes de location (RentalRequest).
 * Flux : création par le locataire → consultation par le propriétaire → Accept/Reject → unit_status = OCCUPIED.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalRequestEntity } from './entities/rental-request.entity';
import { UnitEntity } from '../property/entities/unit.entity';
import { PropertyEntity } from '../property/entities/property.entity';
import { RentalController } from './rental.controller';
import { CreateRentalRequestHandler } from './commands/handlers/create-rental-request.handler/create-rental-request.handler';
import { AcceptRentalRequestHandler } from './commands/handlers/accept-rental-request.handler/accept-rental-request.handler';
import { RejectRentalRequestHandler } from './commands/handlers/reject-rental-request.handler/reject-rental-request.handler';
import { GetRentalRequestsForLandlordHandler } from './queries/handlers/get-rental-requests-for-landlord.handler/get-rental-requests-for-landlord.handler';
import { GetRentalRequestsForTenantHandler } from './queries/handlers/get-rental-requests-for-tenant.handler/get-rental-requests-for-tenant.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([RentalRequestEntity, UnitEntity, PropertyEntity]),
  ],
  controllers: [RentalController],
  providers: [
    CreateRentalRequestHandler,
    AcceptRentalRequestHandler,
    RejectRentalRequestHandler,
    GetRentalRequestsForLandlordHandler,
    GetRentalRequestsForTenantHandler,
  ],
  exports: [TypeOrmModule],
})
export class RentalModule {}
