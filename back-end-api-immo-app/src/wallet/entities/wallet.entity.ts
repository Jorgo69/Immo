/**
 * Entité Wallet — alignée sur le schéma DBML (Tirelire Loyer).
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserModel } from '../../auth/models/user.model/user.model';
import { TransactionEntity } from './transaction.entity';

@Entity('wallets')
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @OneToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance_total: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'balance_savings' })
  balance_savings: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;

  @OneToMany(() => TransactionEntity, (tx) => tx.wallet)
  transactions: TransactionEntity[];
}
