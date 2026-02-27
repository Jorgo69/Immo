import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateProfileCommand {
  userId: string; // from JWT

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) full_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) id_card?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) profession?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) company?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) @Matches(/^\d{13}$/, { message: "L'IFU doit être composé d'exactement 13 chiffres" }) ifu?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) @Matches(/^RB\/[a-zA-Z]+\/\d{2}\s*[a-zA-Z]\s*\d+$/, { message: "Le RCCM doit respecter le format béninois (ex: RB/COT/25 A 1234)" }) rccm?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) emergency_contact?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) preferred_zone?: string;
  @ApiProperty({ required: false, type: [String], description: 'Plusieurs zones (sélection multiple)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_zones?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(50) budget_min?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(50) budget_max?: string;
}
