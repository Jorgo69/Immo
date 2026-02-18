/**
 * DTO et constantes pour la pagination (listes backend).
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

/** Paramètres de pagination (query string) */
export class PaginationQueryDto {
  @ApiProperty({ required: false, default: 1, description: 'Numéro de page (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, maximum: 100, description: 'Nombre d\'éléments par page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_MAX_LIMIT)
  limit?: number = PAGINATION_DEFAULT_LIMIT;
}

/** Réponse paginée générique */
export interface PaginatedResultDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResultDto<T> {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return { data, total, page, limit, totalPages };
}
