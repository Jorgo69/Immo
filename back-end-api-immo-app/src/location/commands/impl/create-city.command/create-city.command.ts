/**
 * Commande : créer une ville (Admin uniquement).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCityCommand {
  @ApiProperty() @IsNotEmpty() @IsUUID() country_id: string;
  @ApiProperty() @IsNotEmpty() @IsString() @MinLength(1) @MaxLength(150) name: string;
}
