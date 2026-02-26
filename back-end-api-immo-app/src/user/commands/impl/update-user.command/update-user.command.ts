/**
 * Mise à jour du profil utilisateur connecté (nom, email, langue, rôle, etc.).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsEmail, IsUrl, MaxLength } from 'class-validator';
import { UserRole } from '../../../../auth/models/user.model/user.model';

export class UpdateUserCommand {
  id: string; // Renseigné depuis le JWT

  @ApiProperty({ description: 'Prénom', required: false })
  @IsOptional()
  @MaxLength(100)
  first_name?: string;

  @ApiProperty({ description: 'Nom', required: false })
  @IsOptional()
  @MaxLength(100)
  last_name?: string;

  @ApiProperty({ description: 'Email (unique)', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'URL de l’avatar', required: false })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar_url?: string;

  @ApiProperty({ description: 'Langue préférée', example: 'fr', required: false })
  @IsOptional()
  @MaxLength(5)
  preferred_lang?: string;

  @ApiProperty({ description: 'Devise préférée', example: 'XOF', required: false })
  @IsOptional()
  @MaxLength(10)
  preferred_currency?: string;

  @ApiProperty({ description: 'Thème préféré', example: 'dark', required: false })
  @IsOptional()
  @MaxLength(10)
  preferred_theme?: string;

  @ApiProperty({ description: 'Rôle (tenant, landlord, agent, admin)', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: 'Compte actif', required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
