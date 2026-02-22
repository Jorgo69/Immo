/**
 * Commande : supprimer une unité (chambre/appart) — soft delete.
 * Le contrôleur vérifie que le demandeur est le propriétaire du bien.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class DeleteUnitCommand {
  @ApiProperty({ description: 'ID de l\'unité à supprimer' })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  /** ID du bien (optionnel si unité autonome). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  property_id?: string | null;

  /** ID du propriétaire (injecté par le contrôleur, pour vérification). */
  owner_id?: string;
}
