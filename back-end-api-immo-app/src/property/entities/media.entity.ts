/**
 * Entité Media — images/vidéos d'un bien (Property).
 * Chaque média : url, rank (ordre), is_primary (image principale), description (i18n JSONB).
 * Une seule image → is_primary=true, rank=1. Sinon la première peut être marquée principale.
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PropertyEntity } from './property.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO_360 = 'video_360',
  VIDEO_SHORT = 'video_short',
}

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_id' })
  property_id: string;

  @ManyToOne(() => PropertyEntity, (p) => p.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @Column({ type: 'int', default: 1 })
  rank: number;

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  is_primary: boolean;

  /** Description du média (i18n) : { "fr": "...", "en": "..." }. */
  @Column({ type: 'jsonb', nullable: true })
  description: Record<string, string> | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
