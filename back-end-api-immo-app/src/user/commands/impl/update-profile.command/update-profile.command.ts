/**
 * Complétion de profil (onboarding) : prénom, nom, email optionnel, avatar optionnel.
 * Utilisé juste après la première connexion quand is_profile_complete est false.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEmail, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileCommand {
  /** Renseigné depuis le JWT (côté controller). */
  id: string;

  @ApiProperty({ description: 'Prénom', example: 'Jean' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ description: 'Nom', example: 'Dupont' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(100)
  last_name: string;

  @ApiProperty({ description: 'Email (optionnel)', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'URL de l’avatar (optionnel)', required: false })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatar_url?: string;
}
