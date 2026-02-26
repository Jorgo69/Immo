/**
 * Commande : créer un bien (La Maison) — marché Bénin.
 * Inclut nom, adresse, city_id, GPS, tableau d'images (url, rank, is_primary, description i18n).
 * owner_id / created_by sont fixés côté serveur (utilisateur connecté).
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
  MaxLength,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { PropertyStatus, PropertyBuildingType } from '../../../entities/property.entity';
import { I18nDto } from '../../../dto/i18n.dto';
import { PropertyImageItemDto } from '../../../dto/property-image.dto';

export class CreatePropertyCommand {
  @ApiPropertyOptional() @IsOptional() @IsUUID() owner_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() agent_id?: string;
  @ApiPropertyOptional({ example: 'Villa Rose' }) @IsOptional() @IsString() @MaxLength(255) name?: string;
  @ApiPropertyOptional({ enum: PropertyBuildingType }) @IsOptional() @IsEnum(PropertyBuildingType) building_type?: PropertyBuildingType;
  @ApiProperty() @IsNotEmpty() @IsString() address: string;
  @ApiPropertyOptional({ description: 'Quartier (ex: Cadjehoun, Gbegamey)' }) @IsOptional() @IsString() @MaxLength(150) neighborhood?: string | null;
  @ApiProperty() @IsNotEmpty() @IsUUID() city_id: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() gps_latitude?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() gps_longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUrl() main_image?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) gallery?: string[];
  @ApiPropertyOptional({ description: 'Description i18n (fr, en)' }) @IsOptional() @ValidateNested() @Type(() => I18nDto) description?: I18nDto;
  @ApiPropertyOptional({ type: [PropertyImageItemDto], description: 'Images avec url, rank, is_primary, description i18n' }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PropertyImageItemDto) images?: PropertyImageItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() title_deed?: string;
  @ApiPropertyOptional({ enum: PropertyStatus }) @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
}
