/**
 * Commande : créer une demande de location (locataire → « Je suis intéressé »).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRentalRequestCommand {
  @ApiProperty({ description: 'Unité concernée' })
  @IsNotEmpty()
  @IsUUID()
  unit_id: string;

  @ApiProperty({ description: 'Locataire (utilisateur connecté)' })
  @IsNotEmpty()
  @IsUUID()
  tenant_id: string;

  @ApiPropertyOptional({ description: 'Message au propriétaire' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ description: "Date d'entrée souhaitée (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  desired_move_in_at?: string;
}
