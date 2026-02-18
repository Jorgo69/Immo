/**
 * Commande : ajouter un média à un bien.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { MediaType } from '../../../entities/media.entity';

export class AddMediaCommand {
  @ApiProperty() @IsNotEmpty() @IsUUID() property_id: string;
  @ApiProperty() @IsNotEmpty() @IsString() url: string;
  @ApiProperty({ enum: MediaType }) @IsNotEmpty() @IsEnum(MediaType) type: MediaType;
}
