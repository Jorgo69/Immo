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

  @Column({ type: 'varchar', nullable: true })
  first_name: string;

  @Column({ type: 'varchar', nullable: true })
  last_name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  /** Passe à true dès que first_name et last_name sont renseignés (onboarding). */
  @Column({ type: 'boolean', default: false, name: 'is_profile_complete' })
  is_profile_complete: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  /** URL de la pièce d'identité (KYC). */
  @Column({ type: 'text', nullable: true, name: 'id_card_url' })
  id_card_url: string | null;

  /** Téléphone vérifié (OTP ou canal validé). */
  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phone_verified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  /** Salt unique par utilisateur pour dérivation de la clé de chiffrement (données sensibles du profil). */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'encryption_salt' })
  encryption_salt: string | null;

  @Column({ type: 'varchar', default: 'fr', length: 5 })
  preferred_lang: string;

  @Column({ type: 'varchar', default: 'XOF', length: 10 })
  preferred_currency: string;

  @Column({ type: 'varchar', default: 'dark', length: 10 })
  preferred_theme: string;

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
