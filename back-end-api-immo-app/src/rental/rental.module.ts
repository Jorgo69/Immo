/**
 * Module Rental — demandes de location (RentalRequest).
 * Flux : création par le locataire → consultation KYC par le propriétaire → validation → unit_status = OCCUPIED.
 * Isolé du futur module Vente (pas de dépendance croisée).
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalRequestEntity } from './entities/rental-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RentalRequestEntity])],
  exports: [TypeOrmModule],
})
export class RentalModule {}
