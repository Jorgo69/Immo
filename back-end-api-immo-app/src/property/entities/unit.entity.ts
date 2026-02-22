/**
 * Entité Unit — ressource transactionnelle principale (Chambre, Parcelle, Boutique, etc.).
 * Peut exister sans Property (ex: vente de parcelle). Si rattachée à une Property, hérite de la localisation
 * mais garde ses propres caractéristiques (prix, conditions, équipements, photos).
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
import { UserModel } from '../../auth/models/user.model/user.model';
import { PropertyEntity } from './property.entity';
import { RefTypeEntity } from '../../references/entities/ref-type.entity';
import { CityEntity } from '../../location/entities/city.entity';

/** Statut de disponibilité. NOTICE_GIVEN exige available_from renseigné. */
export enum UnitStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  NOTICE_GIVEN = 'notice_given',
}

@Entity('units')
export class UnitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Conteneur optionnel. Null si unité autonome (ex: parcelle). */
  @Column({ type: 'uuid', name: 'property_id', nullable: true })
  property_id: string | null;

  @ManyToOne(() => PropertyEntity, (p) => p.units, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity | null;

  /** Propriétaire direct (obligatoire si property_id est null ; sinon déduit du bien). */
  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  owner_id: string | null;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: UserModel | null;

  /** Type d'unité (référentiel). Nullable pour migration : les lignes existantes doivent être backfillées (voir database/migrations/backfill-unit-ref-type-id.sql). */
  @Column({ type: 'uuid', name: 'ref_type_id', nullable: true })
  ref_type_id: string | null;

  @ManyToOne(() => RefTypeEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'ref_type_id' })
  ref_type: RefTypeEntity | null;

  /** Traçabilité : utilisateur ayant créé l'unité. */
  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  /** Description (i18n) : { "fr": "...", "en": "..." }. */
  @Column({ type: 'jsonb', nullable: true })
  description: Record<string, string> | null;

  /** Codes des ref_features sélectionnés pour cette unité (ex: ["Clim", "Balcon"]). */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  features: string[];

  /** Images : [{ url, rank, is_primary, description? }]. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: Array<{ url: string; rank: number; is_primary: boolean; description?: Record<string, string> }>;

  /** Documents de gestion (sensibles) — chiffrés via EncryptionService + owner.encryption_salt. */
  @Column({ type: 'text', nullable: true, name: 'management_docs_enc' })
  management_docs_enc: string | null;

  @Column({ type: 'enum', enum: UnitStatus, name: 'unit_status', default: UnitStatus.AVAILABLE })
  unit_status: UnitStatus;

  /** Obligatoire si unit_status = NOTICE_GIVEN. Date à partir de laquelle l'unité sera disponible. */
  @Column({ type: 'date', nullable: true, name: 'available_from' })
  available_from: string | null;

  /** Localisation propre à l'unité (uniquement si property_id est null). */
  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'uuid', name: 'city_id', nullable: true })
  city_id: string | null;

  @ManyToOne(() => CityEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'gps_latitude' })
  gps_latitude: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'gps_longitude' })
  gps_longitude: string | null;

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
