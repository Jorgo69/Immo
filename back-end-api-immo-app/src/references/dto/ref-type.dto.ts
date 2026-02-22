/**
 * DTO de réponse pour un type d'unité (Chambre, Studio, Parcelle, Bureau) lié à une catégorie.
 */
import { ApiProperty } from '@nestjs/swagger';

export class RefTypeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ref_category_id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  label_fr: string;

  @ApiProperty()
  label_en: string;

  @ApiProperty()
  sort_order: number;
}
