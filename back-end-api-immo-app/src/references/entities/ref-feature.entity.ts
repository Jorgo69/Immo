/**
 * Référentiel des caractéristiques par type (Staffé, Dallé, Compteur personnel, Titre foncier, etc.).
 * Lié à RefType : chaque feature est proposée pour un type donné (ex: "Titre foncier" pour type Parcelle).
 * Isolation : les features du type "Chambre" n'impactent pas le module Vente.
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RefTypeEntity } from './ref-type.entity';

@Entity('ref_features')
@Unique(['ref_type_id', 'code'])
export class RefFeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'ref_type_id' })
  ref_type_id: string;

  @ManyToOne(() => RefTypeEntity, (t) => t.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ref_type_id' })
  ref_type: RefTypeEntity;

  @Column({ type: 'varchar', length: 80 })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'label_fr' })
  label_fr: string;

  @Column({ type: 'varchar', length: 100, name: 'label_en', default: '' })
  label_en: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order: number;
}
