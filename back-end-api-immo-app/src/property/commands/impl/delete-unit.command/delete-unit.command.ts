/**
 * Commande : supprimer une unité (chambre/appart) — soft delete.
 * Le contrôleur vérifie que le demandeur est le propriétaire du bien.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteUnitCommand {
  @ApiProperty({ description: 'ID de l\'unité à supprimer' })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  /** ID du bien (pour cohérence). */
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  property_id: string;

  /** ID du propriétaire (injecté par le contrôleur, pour vérification). */
  owner_id?: string;
}
