/**
 * Commande : créer un bien immobilier.
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { PropertyStatus } from '../../../entities/property.entity';

export class CreatePropertyCommand {
  @ApiProperty() @IsNotEmpty() @IsUUID() owner_id: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() agent_id?: string;
  @ApiProperty() @IsNotEmpty() @IsString() @MaxLength(255) title: string;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() title_translations?: Record<string, string>;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() description_translations?: Record<string, string>;
  @ApiProperty() @IsNotEmpty() @Type(() => Number) @IsNumber() @Min(0) price_monthly: number;
  @ApiProperty() @IsNotEmpty() @IsString() @MaxLength(100) city: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) district?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address_details?: string;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @ApiProperty({ required: false, enum: PropertyStatus }) @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() available_date?: string;
}
