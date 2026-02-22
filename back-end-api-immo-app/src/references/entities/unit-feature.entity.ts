/**
 * Référentiel des équipements/features (Clim, Balcon, Compteur personnel, etc.).
 * Géré par l'Admin, consommé par le Front pour les checkboxes/selects.
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
}
