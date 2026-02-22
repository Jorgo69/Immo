/**
 * Module References — moteur de référentiels (catégories, types, features).
 * Endpoint GET /ref/all pour chargement groupé côté Front.
 * RefCategory → RefType → RefFeature : ajout de nouveaux types (ex: Parcelle) en base sans modifier le code.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyTypeEntity } from './entities/property-type.entity';
import { PropertyStatusEntity } from './entities/property-status.entity';
import { UnitTypeEntity } from './entities/unit-type.entity';
import { UnitFeatureEntity } from './entities/unit-feature.entity';
import { RefCategoryEntity } from './entities/ref-category.entity';
import { RefTypeEntity } from './entities/ref-type.entity';
import { RefFeatureEntity } from './entities/ref-feature.entity';
import { ReferencesController } from './references.controller';
import { ReferencesService } from './references.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PropertyTypeEntity,
      PropertyStatusEntity,
      UnitTypeEntity,
      UnitFeatureEntity,
      RefCategoryEntity,
      RefTypeEntity,
      RefFeatureEntity,
    ]),
  ],
  controllers: [ReferencesController],
  providers: [ReferencesService],
  exports: [TypeOrmModule, ReferencesService],
})
export class ReferencesModule {}
