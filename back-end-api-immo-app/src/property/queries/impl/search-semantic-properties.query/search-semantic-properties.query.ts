/**
 * Query : recherche sémantique (IA) + pagination. Fallback sur recherche texte si non configuré.
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max, IsInt } from 'class-validator';
import { PropertyStatus } from '../../../entities/property.entity';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';

export class SearchSemanticPropertiesQuery {
  @ApiProperty({ description: 'Requête en langage naturel (ex: "studio calme à Calavi 40k")' }) @IsString() q: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string;
  @ApiProperty({ required: false, enum: PropertyStatus }) @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) min_price?: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) max_price?: number;
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiProperty({ required: false, default: PAGINATION_DEFAULT_LIMIT, maximum: PAGINATION_MAX_LIMIT })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(PAGINATION_MAX_LIMIT) limit?: number = PAGINATION_DEFAULT_LIMIT;
}

