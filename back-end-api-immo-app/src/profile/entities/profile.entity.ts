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

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING, name: 'kyc_status' })
  kyc_status: KycStatus;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
