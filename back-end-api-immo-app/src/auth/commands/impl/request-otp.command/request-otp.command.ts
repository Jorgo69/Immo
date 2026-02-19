/**
 * Commande : demande d'envoi d'un OTP au numéro donné.
 * Validation mobile-first : format international E.164 (+229, +33, etc.).
 * Email optionnel : requis pour nouvel utilisateur si canal email actif ; utilisé pour envoi immédiat si connu.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';

/** E.164 : + suivi du code pays (1–3 chiffres) puis 6 à 14 chiffres (sans espaces ni tirets). */
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export class RequestOtpCommand {
  @ApiProperty({
    description: 'Numéro de téléphone international (E.164, ex: +22990123456)',
    example: '+22990123456',
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @Matches(E164_PHONE_REGEX, {
    message: 'Numéro invalide : utilisez le format international (ex: +22990123456)',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Email (optionnel ; requis pour nouvel utilisateur si envoi par email)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;
}
