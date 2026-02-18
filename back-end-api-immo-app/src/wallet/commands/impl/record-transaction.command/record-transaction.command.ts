/**
 * Commande : enregistrer une transaction (Tirelire = type saving) avec mise à jour des soldes en ACID.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from '../../../entities/transaction.entity';

export class RecordTransactionCommand {
  userId: string; // Renseigné depuis le JWT

  @ApiProperty({ description: 'Montant', example: 5000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: TransactionType, description: 'Type de transaction' })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ required: false, description: 'Référence passerelle (FedaPay, etc.)' })
  @IsOptional()
  @IsString()
  gateway_ref?: string;
}
