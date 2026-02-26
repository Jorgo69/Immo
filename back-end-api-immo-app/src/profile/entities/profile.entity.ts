/**
 * Entité Profile — KYC, données chiffrées (schéma DBML).
 */
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserModel } from '../../auth/models/user.model/user.model';

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'user_id' })
  user_id: string;

  @OneToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ type: 'text', nullable: true, name: 'full_name_enc' })
  full_name_enc: string | null;

  @Column({ type: 'text', nullable: true, name: 'id_card_enc' })
  id_card_enc: string | null;

  @Column({ type: 'text', nullable: true, name: 'profession_enc' })
  profession_enc: string | null;

  @Column({ type: 'text', nullable: true, name: 'company_enc' })
  company_enc: string | null;

  @Column({ type: 'text', nullable: true, name: 'emergency_contact_enc' })
  emergency_contact_enc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'preferred_zone' })
  preferred_zone: string | null;

  /** Plusieurs zones (ex. quartiers) — comme sujets d’intérêt, sélection multiple. */
  @Column({ type: 'jsonb', nullable: true, name: 'preferred_zones' })
  preferred_zones: string[] | null;

  @Column({ type: 'text', nullable: true, name: 'budget_min_enc' })
  budget_min_enc: string | null;

  @Column({ type: 'text', nullable: true, name: 'budget_max_enc' })
  budget_max_enc: string | null;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING, name: 'kyc_status' })
  kyc_status: KycStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'kyc_submitted_at' })
  kyc_submitted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'kyc_reviewed_at' })
  kyc_reviewed_at: Date | null;

  @Column({ type: 'text', nullable: true, name: 'kyc_rejection_reason' })
  kyc_rejection_reason: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
