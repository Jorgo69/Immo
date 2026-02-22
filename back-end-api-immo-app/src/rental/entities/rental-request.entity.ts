/**
 * Demande de location — flux interne (sans WhatsApp exclusif).
 * Le locataire clique → une demande est créée en base → le propriétaire voit l'historique (KYC)
 * → le propriétaire valide → le statut de l'unité passe automatiquement à OCCUPIED.
 * WhatsApp sert uniquement de canal de notification final.
 * Isolation : module Location uniquement ; un futur module Vente n'impacte pas cette table.
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserModel } from '../../auth/models/user.model/user.model';
import { UnitEntity } from '../../property/entities/unit.entity';

export enum RentalRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('rental_requests')
export class RentalRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'unit_id' })
  unit_id: string;

  @ManyToOne(() => UnitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenant_id: string;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: UserModel;

  @Column({ type: 'enum', enum: RentalRequestStatus, default: RentalRequestStatus.PENDING })
  status: RentalRequestStatus;

  /** Message optionnel du locataire. */
  @Column({ type: 'text', nullable: true })
  message: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  /** Date de réponse (acceptation ou refus) par le propriétaire. */
  @Column({ type: 'timestamptz', nullable: true, name: 'responded_at' })
  responded_at: Date | null;

  /** Utilisateur ayant répondu (propriétaire ou agent). */
  @Column({ type: 'uuid', nullable: true, name: 'responded_by' })
  responded_by: string | null;
}
