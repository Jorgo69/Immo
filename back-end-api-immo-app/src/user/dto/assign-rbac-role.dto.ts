import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignRbacRoleDto {
  @ApiProperty({ description: 'ID du rôle RBAC à assigner (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ description: 'Motif de l\'assignation (pour log audit)', example: 'Promotion agent de support' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
