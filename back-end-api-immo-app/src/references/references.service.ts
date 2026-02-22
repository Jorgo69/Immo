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
import { RefCategoryEntity } from './entities/ref-category.entity';
import { RefTypeEntity } from './entities/ref-type.entity';
import { RefFeatureEntity } from './entities/ref-feature.entity';

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
    @InjectRepository(RefCategoryEntity)
    private readonly refCategoryRepo: Repository<RefCategoryEntity>,
    @InjectRepository(RefTypeEntity)
    private readonly refTypeRepo: Repository<RefTypeEntity>,
    @InjectRepository(RefFeatureEntity)
    private readonly refFeatureRepo: Repository<RefFeatureEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedIfEmpty();
    await this.seedRefTables();
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

  /** Seed ref_categories, ref_types, ref_features (moteur référentiel). Permet le backfill des units.ref_type_id. */
  private async seedRefTables(): Promise<void> {
    const catCount = await this.refCategoryRepo.count();
    if (catCount > 0) return;

    const loc = await this.refCategoryRepo.save({ code: 'location', label_fr: 'Location', label_en: 'Rental', sort_order: 1 });
    await this.refCategoryRepo.save({ code: 'vente', label_fr: 'Vente', label_en: 'Sale', sort_order: 2 });

    const types = await this.refTypeRepo.save([
      { ref_category_id: loc.id, code: 'studio', label_fr: 'Studio', label_en: 'Studio', sort_order: 1 },
      { ref_category_id: loc.id, code: 'chambre_salon', label_fr: 'Chambre-Salon', label_en: 'Bedroom-Living', sort_order: 2 },
      { ref_category_id: loc.id, code: '2_chambres_salon', label_fr: '2 Chambres-Salon', label_en: '2 Bedrooms-Living', sort_order: 3 },
      { ref_category_id: loc.id, code: '3_chambres_salon', label_fr: '3 Chambres-Salon', label_en: '3 Bedrooms-Living', sort_order: 4 },
      { ref_category_id: loc.id, code: '4_chambres_salon', label_fr: '4 Chambres-Salon', label_en: '4 Bedrooms-Living', sort_order: 5 },
      { ref_category_id: loc.id, code: 'maison', label_fr: 'Maison', label_en: 'House', sort_order: 6 },
    ]);
    const chambreSalon = types.find((t) => t.code === 'chambre_salon');
    if (chambreSalon) {
      await this.refFeatureRepo.save([
        { ref_type_id: chambreSalon.id, code: 'Clim', label_fr: 'Climatisation', label_en: 'Air conditioning', sort_order: 1 },
        { ref_type_id: chambreSalon.id, code: 'Balcon', label_fr: 'Balcon', label_en: 'Balcony', sort_order: 2 },
        { ref_type_id: chambreSalon.id, code: 'Compteur personnel', label_fr: 'Compteur personnel', label_en: 'Private meter', sort_order: 3 },
      ]);
    }
  }

  /** Catégories (Location, Vente, …) pour le moteur référentiel. */
  async getCategories(): Promise<RefDto[]> {
    const list = await this.refCategoryRepo.find({ order: { sort_order: 'ASC' } });
    return list.map((r) => this.toRefDto(r));
  }

  /** Types par catégorie (ou tous si categoryId absent). */
  async getTypes(categoryId?: string): Promise<(RefDto & { ref_category_id: string })[]> {
    const where = categoryId ? { ref_category_id: categoryId } : {};
    const list = await this.refTypeRepo.find({
      where,
      order: { sort_order: 'ASC' },
      relations: ['category'],
    });
    return list.map((r) => ({ ...this.toRefDto(r), ref_category_id: r.ref_category_id }));
  }

  /** Features (équipements) pour un type donné. */
  async getFeaturesByTypeId(refTypeId: string): Promise<(RefDto & { ref_type_id: string })[]> {
    const list = await this.refFeatureRepo.find({
      where: { ref_type_id: refTypeId },
      order: { sort_order: 'ASC' },
    });
    return list.map((r) => ({ ...this.toRefDto(r), ref_type_id: r.ref_type_id }));
  }

  async createCategory(dto: { code: string; label_fr: string; label_en?: string; sort_order?: number }): Promise<RefCategoryEntity> {
    return this.refCategoryRepo.save(dto);
  }

  async updateCategory(id: string, dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number }>): Promise<RefCategoryEntity> {
    await this.refCategoryRepo.update(id, dto as Record<string, unknown>);
    const one = await this.refCategoryRepo.findOne({ where: { id } });
    if (!one) throw new Error('Category not found');
    return one;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.refCategoryRepo.delete(id);
  }

  async createType(dto: { ref_category_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }): Promise<RefTypeEntity> {
    return this.refTypeRepo.save(dto);
  }

  async updateType(id: string, dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number }>): Promise<RefTypeEntity> {
    await this.refTypeRepo.update(id, dto as Record<string, unknown>);
    const one = await this.refTypeRepo.findOne({ where: { id } });
    if (!one) throw new Error('Type not found');
    return one;
  }

  async deleteType(id: string): Promise<void> {
    await this.refTypeRepo.delete(id);
  }

  async createFeature(dto: { ref_type_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }): Promise<RefFeatureEntity> {
    return this.refFeatureRepo.save(dto);
  }

  async updateFeature(id: string, dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number }>): Promise<RefFeatureEntity> {
    await this.refFeatureRepo.update(id, dto as Record<string, unknown>);
    const one = await this.refFeatureRepo.findOne({ where: { id } });
    if (!one) throw new Error('Feature not found');
    return one;
  }

  async deleteFeature(id: string): Promise<void> {
    await this.refFeatureRepo.delete(id);
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
