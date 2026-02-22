/**
 * Commande : ajouter un média à un bien (url, type, rank, is_primary, description i18n).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { MediaType } from '../../../entities/media.entity';
import { I18nDto } from '../../../dto/i18n.dto';

export class AddMediaCommand {
  @ApiProperty() @IsNotEmpty() @IsUUID() property_id: string;
  /** ID de l'utilisateur connecté (injecté par le contrôleur, pour vérification ownership). */
  requested_by?: string;
  @ApiProperty() @IsNotEmpty() @IsString() url: string;
  @ApiProperty({ enum: MediaType }) @IsNotEmpty() @IsEnum(MediaType) type: MediaType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) rank?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() is_primary?: boolean;
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => I18nDto) description?: I18nDto;
}
