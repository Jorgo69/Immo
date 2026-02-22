/**
 * DTO pour features (équipements) en i18n.
 * Structure : { "fr": ["Clim", "Balcon"], "en": ["AC", "Balcony"] }. fr par défaut si absent.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class FeaturesI18nDto {
  @ApiPropertyOptional({ example: ['Clim', 'Balcon'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fr?: string[];

  @ApiPropertyOptional({ example: ['AC', 'Balcony'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  en?: string[];
}

/**
 * Normalise features i18n : garantit au moins fr (copie depuis en ou []).
 */
export function normalizeFeaturesI18n(
  raw: FeaturesI18nDto | Record<string, string[]> | null | undefined,
): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return { fr: [] };
  const out: Record<string, string[]> = {};
  if (Array.isArray((raw as FeaturesI18nDto).fr)) out.fr = (raw as FeaturesI18nDto).fr!;
  else if (Array.isArray((raw as Record<string, string[]>).fr)) out.fr = (raw as Record<string, string[]>).fr;
  else out.fr = [];
  if (Array.isArray((raw as FeaturesI18nDto).en)) out.en = (raw as FeaturesI18nDto).en!;
  else if (Array.isArray((raw as Record<string, string[]>).en)) out.en = (raw as Record<string, string[]>).en;
  else out.en = out.fr;
  return out;
}
