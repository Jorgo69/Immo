import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';

@ApiTags('RBAC - Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtenir la liste de toutes les permissions système (admin)' })
  findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @Post('roles')
  @Roles(UserRole.ADMIN)
  @RequirePermissions('manage:rbac')
  @ApiOperation({ summary: 'Créer un nouveau rôle personnalisé (admin)' })
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole(createRoleDto);
  }

  @Get('roles')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lister tous les rôles et leurs permissions (admin)' })
  findAllRoles() {
    return this.rbacService.findAllRoles();
  }

  @Get('roles/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtenir un rôle spécifique' })
  findRole(@Param('id') id: string) {
    return this.rbacService.findRoleById(id);
  }

  @Patch('roles/:id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions('manage:rbac')
  @ApiOperation({ summary: 'Modifier un rôle' })
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions('manage:rbac')
  @ApiOperation({ summary: 'Supprimer un rôle (si non système)' })
  removeRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }
}
