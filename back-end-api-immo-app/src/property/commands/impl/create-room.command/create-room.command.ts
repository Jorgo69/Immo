/**
 * Commande : créer une chambre sur un bien.
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomCommand {
  @ApiProperty() @IsNotEmpty() @IsUUID() property_id: string;
  @ApiProperty() @IsNotEmpty() @IsString() @MaxLength(150) name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(50) type?: string;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price_monthly?: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) surface_m2?: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) floor?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() is_available?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() description_translations?: Record<string, string>;
}
