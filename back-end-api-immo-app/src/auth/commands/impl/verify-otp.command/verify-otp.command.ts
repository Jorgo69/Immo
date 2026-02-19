/**
 * Commande : vérification de l'OTP et connexion (création utilisateur si premier passage).
 * Validation mobile-first : téléphone au format E.164.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export class VerifyOtpCommand {
  @ApiProperty({
    description: 'Numéro de téléphone international (E.164)',
    example: '+22990123456',
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @Matches(E164_PHONE_REGEX, {
    message: 'Numéro invalide : utilisez le format international (ex: +22990123456)',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Code OTP reçu (6 chiffres)',
    example: '123456',
  })
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  @Matches(/^[0-9]+$/)
  code: string;

  @ApiProperty({
    description: 'Langue préférée (optionnel, défaut: fr)',
    example: 'fr',
    required: false,
  })
  @IsOptional()
  @MaxLength(5)
  preferred_lang?: string;

  @ApiProperty({
    description: 'Email (optionnel ; pour nouvel utilisateur, à fournir si envoi par email)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;
}
