/**
 * Entité City — référentiel des villes (géré par l'Admin).
 * Liaison Property → city_id (FK) : le propriétaire sélectionne dans cette liste.
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CountryEntity } from './country.entity';
import { NeighborhoodEntity } from './neighborhood.entity';

@Entity('cities')
export class CityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'country_id' })
  country_id: string;

  @ManyToOne(() => CountryEntity, (c) => c.cities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @OneToMany(() => NeighborhoodEntity, (n) => n.city)
  neighborhoods: NeighborhoodEntity[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
