/**
 * User Entity - Aligné sur le schéma Immo Bénin (identifiant = téléphone).
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  AGENT = 'agent',
  ADMIN = 'admin',
}

@Entity('users')
export class UserModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  phone_number: string;

  @Column({ type: 'varchar', default: 'fr', length: 5 })
  preferred_lang: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  /** Soft delete : les données sensibles restent en base, masquées des requêtes. */
  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
