import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '../../auth/models/user.model/user.model';

export class ChangeStatusDto {
  @ApiProperty({ description: 'Nouveau statut du compte', enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({ description: 'Motif du bannissement ou de la restriction', example: 'Non-respect des CGU' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
