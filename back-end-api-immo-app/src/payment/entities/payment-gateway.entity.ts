import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentGatewayType {
  FEDAPAY = 'FEDAPAY',
  KKIAPYA = 'KKIAPYA',
  GSM_MTN = 'GSM_MTN',
  GSM_MOOV = 'GSM_MOOV',
  GSM_CELTIS = 'GSM_CELTIS',
}

@Entity('payment_gateways')
export class PaymentGatewayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PaymentGatewayType,
  })
  type: PaymentGatewayType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isTestMode: boolean;

  /**
   * Configuration spécifique (API Keys, etc.)
   * Stocké en JSON pour la flexibilité.
   */
  @Column({ type: 'json', nullable: true })
  config: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
