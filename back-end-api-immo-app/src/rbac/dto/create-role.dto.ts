import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Nom du rôle', example: 'Modérateur KYC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description du rôle' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Liste des IDs de permissions à attacher au rôle', type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  permissionIds?: string[];
}
