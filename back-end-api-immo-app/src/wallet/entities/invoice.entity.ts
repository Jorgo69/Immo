import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WalletEntity } from './wallet.entity';
import { LeaseEntity } from '../../property/entities/lease.entity';

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  wallet_id: string;

  @ManyToOne(() => WalletEntity, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @Column({ type: 'uuid', nullable: true })
  lease_id: string | null;

  @ManyToOne(() => LeaseEntity)
  @JoinColumn({ name: 'lease_id' })
  lease: LeaseEntity | null;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'timestamp' })
  due_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
