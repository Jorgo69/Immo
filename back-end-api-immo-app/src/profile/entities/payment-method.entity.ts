/**
 * Méthode de paiement — token gateway et infos masquées (PCI-DSS).
 * Toutes les données sensibles stockées en _enc, chiffrées avec user.encryption_salt.
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserModel } from '../../auth/models/user.model/user.model';

export enum PaymentMethodType {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
}

@Entity('payment_methods')
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ type: 'varchar', enum: PaymentMethodType })
  type: PaymentMethodType;

  /** Token du gateway (stripe, etc.) — jamais exposé en clair au front. */
  @Column({ type: 'text', name: 'gateway_token_enc' })
  gateway_token_enc: string;

  /** 4 derniers chiffres (chiffré) pour affichage ****1234 */
  @Column({ type: 'text', nullable: true, name: 'last4_enc' })
  last4_enc: string | null;

  /** Marque (Visa, MTN, Moov, etc.) chiffrée */
  @Column({ type: 'text', nullable: true, name: 'brand_enc' })
  brand_enc: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
