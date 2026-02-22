/**
 * Commande : mettre à jour une unité.
 * Tous les champs optionnels. ref_type_id, unit_status, available_from (si notice_given), features (codes).
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
  IsDateString,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UnitStatus } from '../../../entities/unit.entity';
import { I18nDto } from '../../../dto/i18n.dto';
import { UnitImageItemDto } from '../../../dto/unit-image.dto';

export class UpdateUnitCommand {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  property_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ref_type_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  owner_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;

  @ApiPropertyOptional({ description: 'Codes des ref_features' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: [UnitImageItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitImageItemDto)
  images?: UnitImageItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  management_docs?: string;

  @ApiPropertyOptional({ enum: UnitStatus })
  @IsOptional()
  @IsEnum(UnitStatus)
  unit_status?: UnitStatus;

  @ApiPropertyOptional({ description: 'Obligatoire si unit_status = NOTICE_GIVEN' })
  @IsOptional()
  @IsDateString()
  available_from?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  city_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gps_latitude?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gps_longitude?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  surface_m2?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  caution_months?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  avance_months?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  frais_dossier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  prepaid_electricity?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  water_included?: boolean;
}
