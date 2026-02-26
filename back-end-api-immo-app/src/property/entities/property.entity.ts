/**
 * Entité Property (La Maison) — marché immobilier Bénin.
 * name, type (Villa, Immeuble, Bureau, Boutique, Terrain, Maison de ville), address, city_id, gps, main_image, gallery, title_deed_enc.
 * Relation : une Property a une ou plusieurs Units (Villa unique = 1 unit).
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserModel } from '../../auth/models/user.model/user.model';
import { CityEntity } from '../../location/entities/city.entity';
import { MediaEntity } from './media.entity';
import { UnitEntity } from './unit.entity';

export enum PropertyStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  COMING_SOON = 'coming_soon',
}

/** Types de bien réels : Villa, Immeuble, Bureau, Boutique, Magasin, Terrain, Maison de ville. */
export enum PropertyBuildingType {
  VILLA = 'villa',
  IMMEUBLE = 'immeuble',
  BUREAU = 'bureau',
  BOUTIQUE = 'boutique',
  MAGASIN = 'magasin',
  TERRAIN = 'terrain',
  MAISON_DE_VILLE = 'maison_de_ville',
}

@Entity('properties')
export class PropertyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  owner_id: string;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: UserModel;

  @Column({ type: 'uuid', name: 'agent_id', nullable: true })
  agent_id: string | null;

  /** Traçabilité : utilisateur ayant créé le bien (Landlord/Propriétaire). */
  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by: string | null;

  @ManyToOne(() => UserModel, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: UserModel | null;

  @Column({ type: 'varchar', length: 255, default: 'Sans nom' })
  name: string;

  @Column({ type: 'enum', enum: PropertyBuildingType, name: 'building_type', default: PropertyBuildingType.VILLA })
  building_type: PropertyBuildingType;

  @Column({ type: 'text', default: '' })
  address: string;

  /** Quartier (facultatif) — précision de localisation utile au Benin (ex: Cadjehoun, Gbegamey, Zogbo). */
  @Column({ type: 'varchar', length: 150, nullable: true })
  neighborhood: string | null;

  @Column({ type: 'uuid', name: 'city_id', nullable: true })
  city_id: string | null;

  @ManyToOne(() => CityEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'gps_latitude' })
  gps_latitude: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'gps_longitude' })
  gps_longitude: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'main_image' })
  main_image: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  gallery: string[];

  /** Description du bien (i18n) : { "fr": "...", "en": "..." }. */
  @Column({ type: 'jsonb', nullable: true })
  description: Record<string, string> | null;

  /** Titre de propriété (document sensible) — chiffré via EncryptionService + owner.encryption_salt. */
  @Column({ type: 'text', nullable: true, name: 'title_deed_enc' })
  title_deed_enc: string | null;

  @Column({ type: 'enum', enum: PropertyStatus, default: PropertyStatus.AVAILABLE })
  status: PropertyStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;

  @OneToMany(() => MediaEntity, (m) => m.property)
  media: MediaEntity[];

  @OneToMany(() => UnitEntity, (u) => u.property)
  units: UnitEntity[];
}
