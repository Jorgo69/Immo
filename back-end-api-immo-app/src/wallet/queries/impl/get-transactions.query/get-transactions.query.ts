/**
 * Query : liste des transactions du wallet de l'utilisateur (paginée).
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

export class GetTransactionsQuery {
  userId: string; // Renseigné depuis le JWT
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiProperty({ required: false, default: PAGINATION_DEFAULT_LIMIT, maximum: PAGINATION_MAX_LIMIT })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(PAGINATION_MAX_LIMIT) limit?: number = PAGINATION_DEFAULT_LIMIT;
}
