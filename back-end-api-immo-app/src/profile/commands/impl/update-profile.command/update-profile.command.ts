import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileCommand {
  userId: string; // from JWT

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) full_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) id_card?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) profession?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) company?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) emergency_contact?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) preferred_zone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(50) budget_min?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(50) budget_max?: string;
}
