/**
 * Commande : supprimer un bien (soft delete).
 * Cascade : supprime en soft delete les unités et médias liés (ARCHITECTURE §1).
 * Réservé au propriétaire (owner_id fourni par le contrôleur depuis le JWT).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeletePropertyCommand {
  @ApiProperty({ description: 'ID du bien à supprimer' })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  /** ID du propriétaire (injecté par le contrôleur, pour vérification). */
  owner_id?: string;
}
