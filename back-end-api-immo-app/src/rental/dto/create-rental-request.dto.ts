/**
 * DTO de création d'une demande de location.
 * Le locataire clique sur "Je suis intéressé" → une RentalRequest est créée en base.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRentalRequestDto {
  @ApiProperty({ description: 'Unité concernée' })
  @IsNotEmpty()
  @IsUUID()
  unit_id: string;

  @ApiPropertyOptional({ description: 'Message optionnel du locataire' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
