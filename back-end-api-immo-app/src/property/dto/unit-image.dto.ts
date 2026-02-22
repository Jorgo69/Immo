/**
 * DTO pour une image d'unité (chambre/appart).
 * Même structure que PropertyImageItemDto : url, rank, is_primary, description (i18n).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, Min, ValidateNested } from 'class-validator';
import { I18nDto } from './i18n.dto';

export class UnitImageItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rank?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_primary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;
}

/**
 * Normalise les images unité : une seule → is_primary=true, rank=1 ; sinon première sans is_primary devient principale.
 */
export function normalizeUnitImages(
  images: UnitImageItemDto[] | null | undefined,
): Array<{ url: string; rank: number; is_primary: boolean; description?: Record<string, string> }> {
  if (!Array.isArray(images) || images.length === 0) return [];
  const list = images
    .filter((i) => i?.url)
    .map((i, idx) => ({
      url: String(i.url).trim(),
      rank: typeof i.rank === 'number' && i.rank >= 1 ? i.rank : idx + 1,
      is_primary: !!i.is_primary,
      description: i.description && typeof i.description === 'object' ? (i.description as Record<string, string>) : undefined,
    }));
  if (list.length === 1) {
    list[0].is_primary = true;
    list[0].rank = 1;
  } else {
    const hasPrimary = list.some((i) => i.is_primary);
    if (!hasPrimary && list.length > 0) list[0].is_primary = true;
  }
  return list;
}
