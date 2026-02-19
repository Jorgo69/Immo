/**
 * Création manuelle d'un utilisateur (admin ou formulaire d'inscription complet).
 * Le téléphone doit être au format E.164.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEmail, IsEnum, MaxLength, Matches } from 'class-validator';
import { UserRole } from '../../../../auth/models/user.model/user.model';

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export class CreateUserCommand {
  @ApiProperty({
    description: 'Numéro de téléphone international (E.164)',
    example: '+22990123456',
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @Matches(E164_PHONE_REGEX, {
    message: 'Numéro invalide : utilisez le format international (ex: +22990123456)',
  })
  phone_number: string;

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

  @ApiProperty({ description: 'Langue préférée', example: 'fr', required: false })
  @IsOptional()
  @MaxLength(5)
  preferred_lang?: string;

  @ApiProperty({ description: 'Rôle', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
