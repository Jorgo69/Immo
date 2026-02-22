/**
 * Entité Unit (La Chambre/Appartement) — rattachée à une Property.
 * name (ex: Appart B2), type (Studio, Chambre-Salon, 2 Chambres-Salon…), price, description, features, images.
 * Documents de gestion sensibles : management_docs_enc (chiffré).
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PropertyEntity } from './property.entity';

export enum UnitType {
  STUDIO = 'studio',
  CHAMBRE_SALON = 'chambre_salon',
  DEUX_CHAMBRES_SALON = '2_chambres_salon',
  TROIS_CHAMBRES_SALON = '3_chambres_salon',
  QUATRE_CHAMBRES_SALON = '4_chambres_salon',
  MAISON = 'maison',
}

@Entity('units')
export class UnitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_id' })
  property_id: string;

  /** Traçabilité : utilisateur ayant créé l'unité. */
  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by: string | null;

  @ManyToOne(() => PropertyEntity, (p) => p.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: UnitType })
  type: UnitType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  /** Description (i18n) : { "fr": "...", "en": "..." }. */
  @Column({ type: 'jsonb', nullable: true })
  description: Record<string, string> | null;

  /** Équipements (i18n) : { "fr": ["Clim", "Balcon"], "en": ["AC", "Balcony"] }. Anciennes lignes : string[]. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  features: Record<string, string[]> | string[];

  /** Images : [{ url, rank, is_primary, description? }]. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: Array<{ url: string; rank: number; is_primary: boolean; description?: Record<string, string> }>;

  /** Documents de gestion (sensibles) — chiffrés via EncryptionService + owner.encryption_salt. */
  @Column({ type: 'text', nullable: true, name: 'management_docs_enc' })
  management_docs_enc: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  is_available: boolean;

  @Column({ type: 'int', nullable: true, name: 'surface_m2' })
  surface_m2: number | null;

  @Column({ type: 'int', nullable: true })
  floor: number | null;

  /** Standards marché local : nombre de mois de caution. */
  @Column({ type: 'int', nullable: true, name: 'caution_months' })
  caution_months: number | null;

  /** Standards marché local : nombre de mois d'avance. */
  @Column({ type: 'int', nullable: true, name: 'avance_months' })
  avance_months: number | null;

  /** Standards marché local : frais fixes de dossier/agence. */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'frais_dossier' })
  frais_dossier: string | null;

  /** Standards marché local : compteur SBEE à carte (prépayé). */
  @Column({ type: 'boolean', default: false, name: 'prepaid_electricity' })
  prepaid_electricity: boolean;

  /** Standards marché local : eau incluse dans le loyer. */
  @Column({ type: 'boolean', default: false, name: 'water_included' })
  water_included: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
