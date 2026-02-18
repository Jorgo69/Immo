import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileCommand {
  userId: string; // from JWT

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) full_name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) id_card?: string;
}
