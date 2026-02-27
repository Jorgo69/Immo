/**
 * Commande : créer une unité (ressource transactionnelle).
 * L'unité peut être rattachée à un bien (property_id) ou autonome (owner_id + address/city/gps).
 * Type et équipements viennent des référentiels (ref_type_id, features = codes ref_feature).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UnitStatus } from '../../../entities/unit.entity';
import { I18nDto } from '../../../dto/i18n.dto';
import { UnitImageItemDto } from '../../../dto/unit-image.dto';

export class CreateUnitCommand {
  @ApiPropertyOptional({ description: 'Bien conteneur ; null si unité autonome (ex: parcelle)' })
  @IsOptional()
  @IsUUID()
  property_id?: string | null;

  @ApiProperty({ description: 'Type d\'unité (référentiel ref_types)' })
  @IsNotEmpty()
  @IsUUID()
  ref_type_id: string;

  @ApiPropertyOptional({ description: 'Propriétaire direct (obligatoire si property_id est null)' })
  @IsOptional()
  @IsUUID()
  owner_id?: string | null;

  @ApiProperty({ example: 'Appart B2' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Description i18n (fr, en)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => I18nDto)
  description?: I18nDto;

  @ApiPropertyOptional({ description: 'Codes des ref_features (ex: ["Clim", "Balcon"])' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: [UnitImageItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitImageItemDto)
  images?: UnitImageItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  management_docs?: string;

  @ApiPropertyOptional({ enum: UnitStatus })
  @IsOptional()
  @IsEnum(UnitStatus)
  unit_status?: UnitStatus;

  @ApiPropertyOptional({ description: 'Obligatoire si unit_status = NOTICE_GIVEN (ISO date)' })
  @IsOptional()
  @IsDateString()
  available_from?: string | null;

  @ApiPropertyOptional({ description: 'Adresse (unité autonome)' })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ description: 'ID du quartier (optionnel)' })
  @IsOptional()
  @IsUUID()
  neighborhood_id?: string | null;

  @ApiPropertyOptional({ description: 'Ville (unité autonome)' })
  @IsOptional()
  @IsUUID()
  city_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gps_latitude?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gps_longitude?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  surface_m2?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  floor?: number;

  @ApiPropertyOptional({ description: 'Nombre de mois de caution' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  caution_months?: number;

  @ApiPropertyOptional({ description: 'Nombre de mois d\'avance' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  avance_months?: number;

  @ApiPropertyOptional({ description: 'Frais de dossier (FCFA)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  frais_dossier?: number;

  @ApiPropertyOptional({ description: 'Compteur SBEE à carte (prépayé)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  prepaid_electricity?: boolean;

  @ApiPropertyOptional({ description: 'Eau incluse dans le loyer' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  water_included?: boolean;
}
