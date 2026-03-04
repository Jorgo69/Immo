import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserModel } from '../../auth/models/user.model/user.model';
import { PropertyEntity } from './property.entity';
import { UnitEntity } from './unit.entity';

export enum LeaseStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  ACTIVE = 'active',
  TERMINATED = 'terminated',
}

export enum ContractType {
  STANDARD = 'standard',
  CUSTOM = 'custom',
}

@Entity('leases')
export class LeaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => UserModel)
  @JoinColumn({ name: 'tenant_id' })
  tenant: UserModel;

  @Column({ type: 'uuid' })
  landlord_id: string;

  @ManyToOne(() => UserModel)
  @JoinColumn({ name: 'landlord_id' })
  landlord: UserModel;

  @Column({ type: 'uuid' })
  property_id: string;

  @ManyToOne(() => PropertyEntity)
  @JoinColumn({ name: 'property_id' })
  property: PropertyEntity;

  @Column({ type: 'uuid', nullable: true })
  unit_id: string | null;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthly_rent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  deposit_amount: number;

  @Column({ type: 'enum', enum: ContractType, default: ContractType.STANDARD })
  contract_type: ContractType;

  @Column({ type: 'text', nullable: true })
  contract_content: string | null;

  @Column({ type: 'enum', enum: LeaseStatus, default: LeaseStatus.DRAFT })
  status: LeaseStatus;

  @Column({ type: 'timestamp', nullable: true })
  signed_at_tenant: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  signed_at_landlord: Date | null;

  @Column({ default: false })
  auto_debit_enabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  next_billing_date: Date | null;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
