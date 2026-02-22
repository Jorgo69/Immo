/**
 * Service des référentiels — charge tous les dictionnaires pour le Front.
 * GET /ref/all optimise en un seul appel.
 * Seed automatique au démarrage si les tables sont vides.
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyTypeEntity } from './entities/property-type.entity';
import { PropertyStatusEntity } from './entities/property-status.entity';
import { UnitTypeEntity } from './entities/unit-type.entity';
import { UnitFeatureEntity } from './entities/unit-feature.entity';

export interface RefDto {
  id: string;
  code: string;
  label_fr: string;
  label_en: string;
  sort_order?: number;
  color?: string;
}

export interface RefAllResponse {
  propertyTypes: RefDto[];
  propertyStatuses: RefDto[];
  unitTypes: RefDto[];
  unitFeatures: RefDto[];
}

@Injectable()
export class ReferencesService implements OnModuleInit {
  constructor(
    @InjectRepository(PropertyTypeEntity)
    private readonly propertyTypeRepo: Repository<PropertyTypeEntity>,
    @InjectRepository(PropertyStatusEntity)
    private readonly propertyStatusRepo: Repository<PropertyStatusEntity>,
    @InjectRepository(UnitTypeEntity)
    private readonly unitTypeRepo: Repository<UnitTypeEntity>,
    @InjectRepository(UnitFeatureEntity)
    private readonly unitFeatureRepo: Repository<UnitFeatureEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedIfEmpty();
  }

  /** Seed initial si les tables sont vides. */
  private async seedIfEmpty(): Promise<void> {
    const count = await this.propertyTypeRepo.count();
    if (count > 0) return;

    await this.propertyTypeRepo.save([
      { code: 'villa', label_fr: 'Villa', label_en: 'Villa', sort_order: 1 },
      { code: 'immeuble', label_fr: 'Immeuble', label_en: 'Building', sort_order: 2 },
      { code: 'bureau', label_fr: 'Bureau', label_en: 'Office', sort_order: 3 },
      { code: 'boutique', label_fr: 'Boutique', label_en: 'Shop', sort_order: 4 },
      { code: 'magasin', label_fr: 'Magasin', label_en: 'Store', sort_order: 5 },
      { code: 'terrain', label_fr: 'Terrain', label_en: 'Land', sort_order: 6 },
      { code: 'maison_de_ville', label_fr: 'Maison de ville', label_en: 'Town house', sort_order: 7 },
    ]);
    await this.propertyStatusRepo.save([
      { code: 'available', label_fr: 'Disponible', label_en: 'Available', color: 'green', sort_order: 1 },
      { code: 'coming_soon', label_fr: 'Bientôt disponible', label_en: 'Coming soon', color: 'amber', sort_order: 2 },
      { code: 'occupied', label_fr: 'Occupé', label_en: 'Occupied', color: 'gray', sort_order: 3 },
      { code: 'maintenance', label_fr: 'En maintenance', label_en: 'Under maintenance', color: 'orange', sort_order: 4 },
    ]);
    await this.unitTypeRepo.save([
      { code: 'studio', label_fr: 'Studio', label_en: 'Studio', sort_order: 1 },
      { code: 'chambre_salon', label_fr: 'Chambre-Salon', label_en: 'Bedroom-Living', sort_order: 2 },
      { code: '2_chambres_salon', label_fr: '2 Chambres-Salon', label_en: '2 Bedrooms-Living', sort_order: 3 },
      { code: '3_chambres_salon', label_fr: '3 Chambres-Salon', label_en: '3 Bedrooms-Living', sort_order: 4 },
      { code: '4_chambres_salon', label_fr: '4 Chambres-Salon', label_en: '4 Bedrooms-Living', sort_order: 5 },
      { code: 'maison', label_fr: 'Maison', label_en: 'House', sort_order: 6 },
    ]);
    await this.unitFeatureRepo.save([
      { code: 'Clim', label_fr: 'Climatisation', label_en: 'Air conditioning', sort_order: 1 },
      { code: 'Balcon', label_fr: 'Balcon', label_en: 'Balcony', sort_order: 2 },
      { code: 'Compteur personnel', label_fr: 'Compteur personnel', label_en: 'Private meter', sort_order: 3 },
    ]);
  }

  /**
   * Renvoie tous les référentiels en un seul appel pour optimiser le chargement Front.
   */
  async getAll(): Promise<RefAllResponse> {
    const [propertyTypes, propertyStatuses, unitTypes, unitFeatures] = await Promise.all([
      this.propertyTypeRepo.find({ order: { sort_order: 'ASC' } }),
      this.propertyStatusRepo.find({ order: { sort_order: 'ASC' } }),
      this.unitTypeRepo.find({ order: { sort_order: 'ASC' } }),
      this.unitFeatureRepo.find({ order: { sort_order: 'ASC' } }),
    ]);

    return {
      propertyTypes: propertyTypes.map((r) => this.toRefDto(r)),
      propertyStatuses: propertyStatuses.map((r) => ({
        ...this.toRefDto(r),
        color: r.color ?? undefined,
      })),
      unitTypes: unitTypes.map((r) => this.toRefDto(r)),
      unitFeatures: unitFeatures.map((r) => this.toRefDto(r)),
    };
  }

  private toRefDto(r: { id: string; code: string; label_fr: string; label_en: string; sort_order?: number }): RefDto {
    return {
      id: r.id,
      code: r.code,
      label_fr: r.label_fr,
      label_en: r.label_en,
      sort_order: (r as { sort_order?: number }).sort_order,
    };
  }
}
