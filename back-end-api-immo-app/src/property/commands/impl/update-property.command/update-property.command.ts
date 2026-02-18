/**
 * Commande : mettre à jour un bien (champs optionnels).
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsObject,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { PropertyStatus } from '../../../entities/property.entity';

export class UpdatePropertyCommand {
  @ApiProperty() id: string; // Renseigné depuis la route
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() agent_id?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255) title?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() title_translations?: Record<string, string>;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() description_translations?: Record<string, string>;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) price_monthly?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) district?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address_details?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() latitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() longitude?: number;
  @ApiProperty({ required: false, enum: PropertyStatus }) @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() available_date?: string;
}
