/**
 * Commande : mettre à jour une unité (chambre/appart).
 * Tous les champs optionnels ; description/features en i18n, images avec rank/is_primary/description.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UnitType } from '../../../entities/unit.entity';
import { I18nDto } from '../../../dto/i18n.dto';
import { FeaturesI18nDto } from '../../../dto/features-i18n.dto';
import { UnitImageItemDto } from '../../../dto/unit-image.dto';

export class UpdateUnitCommand {
  @ApiProperty() id: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() property_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(UnitType) type?: UnitType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => I18nDto) description?: I18nDto;
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => FeaturesI18nDto) features?: FeaturesI18nDto;
  @ApiPropertyOptional({ type: [UnitImageItemDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UnitImageItemDto) images?: UnitImageItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() management_docs?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() is_available?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) surface_m2?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) floor?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(24) caution_months?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(24) avance_months?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) frais_dossier?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() prepaid_electricity?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() water_included?: boolean;
}
