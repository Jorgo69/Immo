/**
 * Mise à jour du profil utilisateur connecté (langue, rôle optionnel).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { UserRole } from '../../../../auth/models/user.model/user.model';

export class UpdateUserCommand {
  id: string; // Renseigné depuis le JWT

  @ApiProperty({
    description: 'Langue préférée',
    example: 'fr',
    required: false,
  })
  @IsOptional()
  @MaxLength(5)
  preferred_lang?: string;

  @ApiProperty({
    description: 'Rôle (tenant, landlord, agent, admin)',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Compte actif',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
