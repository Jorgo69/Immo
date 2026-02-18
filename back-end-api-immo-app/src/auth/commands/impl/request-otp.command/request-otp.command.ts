/**
 * Commande : demande d'envoi d'un OTP au numéro donné.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class RequestOtpCommand {
  @ApiProperty({
    description: 'Numéro de téléphone (identifiant principal)',
    example: '+22990123456',
  })
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s-]{8,20}$/, {
    message: 'Format de numéro invalide',
  })
  phone_number: string;
}
