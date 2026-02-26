/**
 * Référentiel des équipements/features (Clim, Balcon, Eau courante, etc.).
 * Géré par l'Admin via CRUD, consommé par le Front pour les checkboxes.
 * Supporte icône Lucide (icon_lucide) ou SVG custom (icon_svg). L'un ou l'autre s'affiche.
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('unit_features')
export class UnitFeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'label_fr' })
  label_fr: string;

  @Column({ type: 'varchar', length: 100, name: 'label_en', default: '' })
  label_en: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order: number;

  /** Nom d'icône Lucide (ex: "Droplets", "Zap", "Wifi"). Prioritaire sur icon_svg. */
  @Column({ type: 'varchar', length: 80, name: 'icon_lucide', nullable: true, default: null })
  icon_lucide: string | null;

  /** SVG brut en fallback si icon_lucide est absent. */
  @Column({ type: 'text', name: 'icon_svg', nullable: true, default: null })
  icon_svg: string | null;
}
