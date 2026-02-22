/**
 * DTO pour champs internationalisés (JSONB).
 * Structure cible : { "fr": "...", "en": "..." }. La langue fr est la valeur par défaut si aucune autre n'est fournie.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class I18nDto {
  @ApiPropertyOptional({ example: 'Description en français' })
  @IsOptional()
  @IsString()
  fr?: string;

  @ApiPropertyOptional({ example: 'Description in English' })
  @IsOptional()
  @IsString()
  en?: string;
}

/**
 * Normalise un objet i18n : garantit au moins la clé "fr" (copie depuis "en" ou chaîne vide).
 */
export function normalizeI18n<T extends Record<string, string>>(raw: T | null | undefined): Record<string, string> {
  if (!raw || typeof raw !== 'object') return { fr: '' };
  const out: Record<string, string> = { ...raw };
  if (typeof out.fr !== 'string') out.fr = typeof out.en === 'string' ? out.en : '';
  if (typeof out.en !== 'string') out.en = out.fr;
  return out;
}
