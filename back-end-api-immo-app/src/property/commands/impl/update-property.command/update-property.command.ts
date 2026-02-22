/**
 * Commande : mettre à jour un bien (champs optionnels).
 * Inclut tableau d'images (url, rank, is_primary, description i18n) et description i18n.
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
  MaxLength,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { PropertyStatus, PropertyBuildingType } from '../../../entities/property.entity';
import { I18nDto } from '../../../dto/i18n.dto';
import { PropertyImageItemDto } from '../../../dto/property-image.dto';

export class UpdatePropertyCommand {
  @ApiProperty() id: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() agent_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(PropertyBuildingType) building_type?: PropertyBuildingType;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() city_id?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() gps_latitude?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() gps_longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsUrl() main_image?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) gallery?: string[];
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => I18nDto) description?: I18nDto;
  @ApiPropertyOptional({ type: [PropertyImageItemDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PropertyImageItemDto) images?: PropertyImageItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
}
