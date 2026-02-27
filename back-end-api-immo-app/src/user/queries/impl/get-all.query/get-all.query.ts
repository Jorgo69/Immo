/**
 * Get All Users Query — avec pagination.
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsBoolean, IsString, MaxLength } from 'class-validator';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../../../../common/dto/pagination.dto';
import { UserRole, UserStatus } from '../../../../auth/models/user.model/user.model';

export class GetAllQuery {
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiProperty({ required: false, default: PAGINATION_DEFAULT_LIMIT, maximum: PAGINATION_MAX_LIMIT })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(PAGINATION_MAX_LIMIT) limit?: number = PAGINATION_DEFAULT_LIMIT;
  @ApiProperty({ required: false, enum: UserRole }) @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @ApiProperty({ required: false, enum: UserStatus }) @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @ApiProperty({ required: false, description: 'Recherche par numéro de téléphone (partiel)' })
  @IsOptional() @IsString() @MaxLength(50) search?: string;
}
