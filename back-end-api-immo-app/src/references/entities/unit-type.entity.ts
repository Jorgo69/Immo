/**
 * Référentiel des types d'unités (studio, chambre_salon, 2_chambres_salon, etc.).
 * Géré par l'Admin, consommé par le Front pour les selects.
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PropertyTypeEntity } from './property-type.entity';

@Entity('unit_types')
export class UnitTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_type_id', nullable: true })
  property_type_id: string | null;

  @ManyToOne(() => PropertyTypeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'property_type_id' })
  property_type: PropertyTypeEntity | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'label_fr' })
  label_fr: string;

  @Column({ type: 'varchar', length: 100, name: 'label_en', default: '' })
  label_en: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order: number;
}
