/**
 * Commande : créer un pays (Admin uniquement).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCountryCommand {
  @ApiProperty() @IsNotEmpty() @IsString() @MinLength(1) @MaxLength(100) name: string;
  @ApiProperty({ example: 'BJ' }) @IsNotEmpty() @IsString() @MinLength(2) @MaxLength(3) iso_code: string;
}
