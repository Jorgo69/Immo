/**
 * Service des référentiels — charge tous les dictionnaires pour le Front.
 * GET /ref/all optimise en un seul appel.
 * Seed automatique au démarrage si les tables sont vides.
 * CRUD Admin : unit_features (avec icônes), property_statuses, ref_categories, ref_types, ref_features, property_types, unit_types.
 */
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
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

export interface UnitFeatureDto extends RefDto {
  icon_lucide: string | null;
  icon_svg: string | null;
}

export interface RefAllResponse {
  propertyTypes: RefDto[];
  propertyStatuses: RefDto[];
  unitTypes: RefDto[];
  unitFeatures: UnitFeatureDto[];
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
    // Seed équipements enrichis avec icônes Lucide
    await this.unitFeatureRepo.save([
      { code: 'clim', label_fr: 'Climatisation', label_en: 'Air conditioning', sort_order: 1, icon_lucide: 'Wind' },
      { code: 'balcon', label_fr: 'Balcon', label_en: 'Balcony', sort_order: 2, icon_lucide: 'Sunset' },
      { code: 'compteur_personnel', label_fr: 'Compteur personnel', label_en: 'Private meter', sort_order: 3, icon_lucide: 'Zap' },
      { code: 'eau_courante', label_fr: 'Eau courante', label_en: 'Running water', sort_order: 4, icon_lucide: 'Droplets' },
      { code: 'gardien', label_fr: 'Gardien', label_en: 'Security guard', sort_order: 5, icon_lucide: 'ShieldCheck' },
      { code: 'parking', label_fr: 'Parking', label_en: 'Parking', sort_order: 6, icon_lucide: 'Car' },
      { code: 'wifi', label_fr: 'Wi-Fi', label_en: 'Wi-Fi', sort_order: 7, icon_lucide: 'Wifi' },
      { code: 'generatrice', label_fr: 'Groupe électrogène', label_en: 'Generator', sort_order: 8, icon_lucide: 'BatteryCharging' },
      { code: 'cuisine_equipee', label_fr: 'Cuisine équipée', label_en: 'Equipped kitchen', sort_order: 9, icon_lucide: 'ChefHat' },
      { code: 'meuble', label_fr: 'Meublé', label_en: 'Furnished', sort_order: 10, icon_lucide: 'Sofa' },
    ]);
  }

  /** Seed ref_categories, ref_types, ref_features (moteur référentiel). */
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
        { ref_type_id: chambreSalon.id, code: 'clim', label_fr: 'Climatisation', label_en: 'Air conditioning', sort_order: 1 },
        { ref_type_id: chambreSalon.id, code: 'balcon', label_fr: 'Balcon', label_en: 'Balcony', sort_order: 2 },
        { ref_type_id: chambreSalon.id, code: 'compteur_personnel', label_fr: 'Compteur personnel', label_en: 'Private meter', sort_order: 3 },
      ]);
    }
  }

  // ————————————————————————————————————————————————————————————
  // LECTURES PUBLIQUES
  // ————————————————————————————————————————————————————————————

  /** Catégories (Location, Vente, …) pour le moteur référentiel. */
  async getCategories(): Promise<RefDto[]> {
    const list = await this.refCategoryRepo.find({ order: { sort_order: 'ASC' } });
    return list.map((r) => this.toRefDto(r));
  }

  /** Types de bâtiments (Villa, Immeuble, …). */
  async getPropertyTypes(): Promise<RefDto[]> {
    const list = await this.propertyTypeRepo.find({ order: { sort_order: 'ASC' } });
    return list.map((r) => this.toRefDto(r));
  }

  /** Statuts de bien (Disponible, Occupé, …). */
  async getPropertyStatuses(): Promise<(RefDto & { color: string | null })[]> {
    const list = await this.propertyStatusRepo.find({ order: { sort_order: 'ASC' } });
    return list.map((r) => ({ ...this.toRefDto(r), color: r.color ?? null }));
  }

  /** Types d'unités (Studio, Chambre-Salon, …). */
  async getUnitTypes(): Promise<(RefDto & { property_type_id: string | null })[]> {
    const list = await this.unitTypeRepo.find({
      order: { sort_order: 'ASC' },
      relations: ['property_type'],
    });
    return list.map((r) => ({ ...this.toRefDto(r), property_type_id: r.property_type_id }));
  }

  /** Équipements standalone (gérés par l'admin). */
  async getUnitFeatures(): Promise<UnitFeatureDto[]> {
    const list = await this.unitFeatureRepo.find({ order: { sort_order: 'ASC' } });
    return list.map((r) => this.toUnitFeatureDto(r));
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

  /** Features (équipements moteur) pour un type donné. */
  async getFeaturesByTypeId(refTypeId: string): Promise<(RefDto & { ref_type_id: string })[]> {
    const list = await this.refFeatureRepo.find({
      where: { ref_type_id: refTypeId },
      order: { sort_order: 'ASC' },
    });
    return list.map((r) => ({ ...this.toRefDto(r), ref_type_id: r.ref_type_id }));
  }

  /**
   * Renvoie tous les référentiels en un seul appel pour optimiser le chargement Front.
   */
  async getAll(): Promise<RefAllResponse> {
    const [propertyTypes, propertyStatuses, unitTypes, unitFeatures] = await Promise.all([
      this.propertyTypeRepo.find({ order: { sort_order: 'ASC' } }),
      this.propertyStatusRepo.find({ order: { sort_order: 'ASC' } }),
      this.unitTypeRepo.find({ order: { sort_order: 'ASC' }, relations: ['property_type'] }),
      this.unitFeatureRepo.find({ order: { sort_order: 'ASC' } }),
    ]);

    return {
      propertyTypes: propertyTypes.map((r) => this.toRefDto(r)),
      propertyStatuses: propertyStatuses.map((r) => ({ ...this.toRefDto(r), color: r.color ?? undefined })),
      unitTypes: unitTypes.map((r) => ({ ...this.toRefDto(r), property_type_id: r.property_type_id })),
      unitFeatures: unitFeatures.map((r) => this.toUnitFeatureDto(r)),
    };
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — ref_categories
  // ————————————————————————————————————————————————————————————

  async createCategory(dto: { code: string; label_fr: string; label_en?: string; sort_order?: number }): Promise<RefCategoryEntity> {
    return this.refCategoryRepo.save(dto);
  }

  async updateCategory(id: string, dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number }>): Promise<RefCategoryEntity> {
    await this.refCategoryRepo.update(id, dto as Record<string, unknown>);
    const one = await this.refCategoryRepo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('Category not found');
    return one;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.refCategoryRepo.delete(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — ref_types
  // ————————————————————————————————————————————————————————————

  async createType(dto: { ref_category_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }): Promise<RefTypeEntity> {
    return this.refTypeRepo.save(dto);
  }

  async updateType(id: string, dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number }>): Promise<RefTypeEntity> {
    await this.refTypeRepo.update(id, dto as Record<string, unknown>);
    const one = await this.refTypeRepo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('Type not found');
    return one;
  }

  async deleteType(id: string): Promise<void> {
    await this.refTypeRepo.delete(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — ref_features
  // ————————————————————————————————————————————————————————————

  async createFeature(dto: { ref_type_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }): Promise<RefFeatureEntity> {
    return this.refFeatureRepo.save(dto);
  }

  async updateFeature(id: string, dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number }>): Promise<RefFeatureEntity> {
    await this.refFeatureRepo.update(id, dto as Record<string, unknown>);
    const one = await this.refFeatureRepo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('Feature not found');
    return one;
  }

  async deleteFeature(id: string): Promise<void> {
    await this.refFeatureRepo.delete(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — property_types
  // ————————————————————————————————————————————————————————————

  async createPropertyType(dto: { code: string; label_fr: string; label_en?: string; sort_order?: number }): Promise<PropertyTypeEntity> {
    return this.propertyTypeRepo.save(dto);
  }

  async updatePropertyType(
    id: string,
    dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number }>,
  ): Promise<PropertyTypeEntity> {
    await this.propertyTypeRepo.update(id, dto as Record<string, unknown>);
    const one = await this.propertyTypeRepo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('Property type not found');
    return one;
  }

  async deletePropertyType(id: string): Promise<void> {
    await this.propertyTypeRepo.delete(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — property_statuses
  // ————————————————————————————————————————————————————————————

  async createPropertyStatus(dto: {
    code: string;
    label_fr: string;
    label_en?: string;
    color?: string;
    sort_order?: number;
  }): Promise<PropertyStatusEntity> {
    return this.propertyStatusRepo.save(dto);
  }

  async updatePropertyStatus(
    id: string,
    dto: Partial<{ code: string; label_fr: string; label_en: string; color: string; sort_order: number }>,
  ): Promise<PropertyStatusEntity> {
    await this.propertyStatusRepo.update(id, dto as Record<string, unknown>);
    const one = await this.propertyStatusRepo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('Property status not found');
    return one;
  }

  async deletePropertyStatus(id: string): Promise<void> {
    await this.propertyStatusRepo.delete(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — unit_types
  // ————————————————————————————————————————————————————————————

  async createUnitType(dto: { code: string; label_fr: string; label_en?: string; sort_order?: number; property_type_id?: string }): Promise<UnitTypeEntity> {
    return this.unitTypeRepo.save(dto);
  }

  async updateUnitType(
    id: string,
    dto: Partial<{ code: string; label_fr: string; label_en: string; sort_order: number; property_type_id: string | null }>,
  ): Promise<UnitTypeEntity> {
    await this.unitTypeRepo.update(id, dto as Record<string, unknown>);
    const one = await this.unitTypeRepo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('Unit type not found');
    return one;
  }

  async deleteUnitType(id: string): Promise<void> {
    await this.unitTypeRepo.delete(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — unit_features (équipements enrichis avec icônes)
  // ————————————————————————————————————————————————————————————

  async createUnitFeature(dto: {
    code: string;
    label_fr: string;
    label_en?: string;
    sort_order?: number;
    icon_lucide?: string | null;
    icon_svg?: string | null;
  }): Promise<UnitFeatureEntity> {
    return this.unitFeatureRepo.save(dto);
  }

  async updateUnitFeature(
    id: string,
    dto: Partial<{
      code: string;
      label_fr: string;
      label_en: string;
      sort_order: number;
      icon_lucide: string | null;
      icon_svg: string | null;
    }>,
  ): Promise<UnitFeatureEntity> {
    await this.unitFeatureRepo.update(id, dto as Record<string, unknown>);
    const one = await this.unitFeatureRepo.findOne({ where: { id } });
    if (!one) throw new NotFoundException('Unit feature not found');
    return one;
  }

  async deleteUnitFeature(id: string): Promise<void> {
    await this.unitFeatureRepo.delete(id);
  }

  // ————————————————————————————————————————————————————————————
  // HELPERS
  // ————————————————————————————————————————————————————————————

  private toRefDto(r: { id: string; code: string; label_fr: string; label_en: string; sort_order?: number }): RefDto {
    return {
      id: r.id,
      code: r.code,
      label_fr: r.label_fr,
      label_en: r.label_en,
      sort_order: (r as { sort_order?: number }).sort_order,
    };
  }

  private toUnitFeatureDto(r: UnitFeatureEntity): UnitFeatureDto {
    return {
      id: r.id,
      code: r.code,
      label_fr: r.label_fr,
      label_en: r.label_en,
      sort_order: r.sort_order,
      icon_lucide: r.icon_lucide,
      icon_svg: r.icon_svg,
    };
  }
}
