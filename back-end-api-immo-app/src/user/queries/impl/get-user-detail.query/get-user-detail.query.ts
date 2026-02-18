/**
 * Query : détail utilisateur pour l’admin (user + stats selon rôle).
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetUserDetailQuery {
  @ApiProperty({ description: 'User ID (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
