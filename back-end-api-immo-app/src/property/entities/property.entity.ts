/**
 * Entité Property — alignée sur le schéma DBML (biens immobiliers).
 * title_translations / description_translations en JSONB (i18n).
 * description_vector prévu pour pgvector (recherche sémantique, à brancher plus tard).
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
import { MediaEntity } from './media.entity';
import { RoomEntity } from './room.entity';

export enum PropertyStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  COMING_SOON = 'coming_soon',
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

  @ManyToOne(() => UserModel, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent: UserModel | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'jsonb', nullable: true, name: 'title_translations' })
  title_translations: Record<string, string> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'description_translations' })
  description_translations: Record<string, string> | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'price_monthly' })
  price_monthly: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'text', nullable: true, name: 'address_details' })
  address_details: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: string | null;

  @Column({ type: 'enum', enum: PropertyStatus, default: PropertyStatus.AVAILABLE })
  status: PropertyStatus;

  @Column({ type: 'date', nullable: true, name: 'available_date' })
  available_date: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  /** Soft delete : le bien et ses données restent en base, masqués des listes/carte. */
  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;

  @OneToMany(() => MediaEntity, (m) => m.property)
  media: MediaEntity[];

  @OneToMany(() => RoomEntity, (r) => r.property)
  rooms: RoomEntity[];
}
