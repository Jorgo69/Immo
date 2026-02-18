/**
 * Entité Room — chambres/pièces rattachées à un bien.
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

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'property_id' })
  property_id: string;

  @ManyToOne(() => PropertyEntity, (p) => p.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'price_monthly' })
  price_monthly: string | null;

  @Column({ type: 'int', nullable: true, name: 'surface_m2' })
  surface_m2: number | null;

  @Column({ type: 'int', nullable: true })
  floor: number | null;

  @Column({ type: 'boolean', default: true, name: 'is_available' })
  is_available: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'description_translations' })
  description_translations: Record<string, string> | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}

