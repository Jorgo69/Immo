/**
 * Entité Media — photos / vidéos 360° / vidéos courtes (schéma DBML).
 */
import {
  Column,
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

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
