import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CityEntity } from './city.entity';

@Entity('neighborhoods')
export class NeighborhoodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'city_id' })
  city_id: string;

  @ManyToOne(() => CityEntity, (c) => c.neighborhoods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city: CityEntity;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
