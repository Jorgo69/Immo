/**
 * Commande : créer une unité (chambre/appartement) sur un bien.
 * description et features en i18n (JSONB). images : tableau { url, rank, is_primary, description? }.
 * management_docs (sensible) chiffré côté serveur. created_by fixé côté serveur.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

export class CreateUnitCommand {
  @ApiProperty() @IsNotEmpty() @IsUUID() property_id: string;
  @ApiProperty({ example: 'Appart B2' }) @IsNotEmpty() @IsString() @MaxLength(150) name: string;
  @ApiProperty({ enum: UnitType }) @IsNotEmpty() @IsEnum(UnitType) type: UnitType;
  @ApiProperty() @IsNotEmpty() @Type(() => Number) @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional({ description: 'Description i18n (fr, en)' }) @IsOptional() @ValidateNested() @Type(() => I18nDto) description?: I18nDto;
  @ApiPropertyOptional({ description: 'Équipements i18n (fr, en arrays)' }) @IsOptional() @ValidateNested() @Type(() => FeaturesI18nDto) features?: FeaturesI18nDto;
  @ApiPropertyOptional({ type: [UnitImageItemDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UnitImageItemDto) images?: UnitImageItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() management_docs?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() is_available?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) surface_m2?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) floor?: number;
  @ApiPropertyOptional({ description: 'Nombre de mois de caution' }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(24) caution_months?: number;
  @ApiPropertyOptional({ description: 'Nombre de mois d\'avance' }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(24) avance_months?: number;
  @ApiPropertyOptional({ description: 'Frais de dossier (FCFA)' }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) frais_dossier?: number;
  @ApiPropertyOptional({ description: 'Compteur SBEE à carte (prépayé)' }) @IsOptional() @Type(() => Boolean) @IsBoolean() prepaid_electricity?: boolean;
  @ApiPropertyOptional({ description: 'Eau incluse dans le loyer' }) @IsOptional() @Type(() => Boolean) @IsBoolean() water_included?: boolean;
}
