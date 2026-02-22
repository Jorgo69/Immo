/**
 * Module References — tables de référence pour types, statuts, équipements.
 * Endpoint GET /ref/all pour chargement groupé côté Front.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyTypeEntity } from './entities/property-type.entity';
import { PropertyStatusEntity } from './entities/property-status.entity';
import { UnitTypeEntity } from './entities/unit-type.entity';
import { UnitFeatureEntity } from './entities/unit-feature.entity';
import { ReferencesController } from './references.controller';
import { ReferencesService } from './references.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PropertyTypeEntity,
      PropertyStatusEntity,
      UnitTypeEntity,
      UnitFeatureEntity,
    ]),
  ],
  controllers: [ReferencesController],
  providers: [ReferencesService],
  exports: [ReferencesService],
})
export class ReferencesModule {}
