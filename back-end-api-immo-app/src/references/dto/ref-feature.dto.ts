/**
 * DTO de réponse pour une caractéristique (RefFeature) liée à un type.
 */
import { ApiProperty } from '@nestjs/swagger';

export class RefFeatureDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ref_type_id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  label_fr: string;

  @ApiProperty()
  label_en: string;

  @ApiProperty()
  sort_order: number;
}
