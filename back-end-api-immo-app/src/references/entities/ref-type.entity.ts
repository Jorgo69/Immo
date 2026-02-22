/**
 * Référentiel des types d'unités par catégorie (Chambre, Studio, Parcelle, Bureau, etc.).
 * Lié à RefCategory : chaque type appartient à une catégorie (ex: Chambre → Location, Parcelle → Vente).
 * L'Admin peut ajouter un type (ex: Parcelle) en base sans déploiement.
 */
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RefCategoryEntity } from './ref-category.entity';
import { RefFeatureEntity } from './ref-feature.entity';

@Entity('ref_types')
@Unique(['ref_category_id', 'code'])
export class RefTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'ref_category_id' })
  ref_category_id: string;

  @ManyToOne(() => RefCategoryEntity, (c) => c.types, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ref_category_id' })
  category: RefCategoryEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'label_fr' })
  label_fr: string;

  @Column({ type: 'varchar', length: 100, name: 'label_en', default: '' })
  label_en: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order: number;

  /** Unicité (code, category) : même code possible dans une autre catégorie. */
  @OneToMany(() => RefFeatureEntity, (f) => f.ref_type)
  features: RefFeatureEntity[];
}
