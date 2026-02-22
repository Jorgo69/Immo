/**
 * Référentiel des statuts de biens (available, occupied, maintenance, coming_soon).
 * Géré par l'Admin, consommé par le Front pour les selects.
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('property_statuses')
export class PropertyStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'label_fr' })
  label_fr: string;

  @Column({ type: 'varchar', length: 100, name: 'label_en', default: '' })
  label_en: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order: number;
}
