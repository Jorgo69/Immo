/**
 * Query : liste des villes (optionnellement par pays).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetCitiesQuery {
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() country_id?: string;
}
