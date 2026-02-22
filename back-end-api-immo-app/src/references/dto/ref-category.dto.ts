/**
 * DTO de réponse pour une catégorie de référentiel (Location, Vente).
 */
import { ApiProperty } from '@nestjs/swagger';

export class RefCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  label_fr: string;

  @ApiProperty()
  label_en: string;

  @ApiProperty()
  sort_order: number;
}
