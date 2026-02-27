import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class UpdateOnboardingDraftDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() first_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() last_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() avatar_url?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() role?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() company?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() ifu?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() rccm?: string;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() preferred_zones?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() budget_min?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() budget_max?: string;
}
