/**
 * Commande : vérification de l'OTP et connexion (création utilisateur si premier passage).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

export class VerifyOtpCommand {
  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+22990123456',
  })
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s-]{8,20}$/, {
    message: 'Format de numéro invalide',
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
}
