/**
 * Référentiel des catégories de ressources (Location, Vente, etc.).
 * Permet d'ajouter de nouvelles catégories en base sans modifier le code.
 * Isolation : le module Location consomme la catégorie "Location", un futur module Vente consomme "Vente".
 */
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RefTypeEntity } from './ref-type.entity';

@Entity('ref_categories')
export class RefCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'label_fr' })
  label_fr: string;

  @Column({ type: 'varchar', length: 100, name: 'label_en', default: '' })
  label_en: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order: number;

  @OneToMany(() => RefTypeEntity, (t) => t.category)
  types: RefTypeEntity[];
}
