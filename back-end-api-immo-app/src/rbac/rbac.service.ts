import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async onModuleInit() {
    await this.seedSystemPermissionsAndRoles();
  }

  // ================= PERMISSIONS =================

  async findAllPermissions(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({ order: { name: 'ASC' } });
  }

  // ================= ROLES =================

  async createRole(dto: CreateRoleDto): Promise<RoleEntity> {
    const existingRole = await this.roleRepository.findOne({ where: { name: dto.name } });
    if (existingRole) {
      throw new BadRequestException(`Un rôle nommé ${dto.name} existe déjà.`);
    }

    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      is_system: false,
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findBy({ id: In(dto.permissionIds) });
      role.permissions = permissions;
    } else {
      role.permissions = [];
    }

    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<RoleEntity[]> {
    return this.roleRepository.find({ relations: ['permissions'], order: { name: 'ASC' } });
  }

  async findRoleById(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) throw new NotFoundException('Rôle introuvable');
    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleEntity> {
    const role = await this.findRoleById(id);

    if (role.is_system && dto.name && dto.name !== role.name) {
       throw new BadRequestException('Impossible de renommer un rôle système.');
    }

    if (dto.name) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;

    if (dto.permissionIds) {
      const permissions = await this.permissionRepository.findBy({ id: In(dto.permissionIds) });
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    if (role.is_system) {
       throw new BadRequestException('Impossible de supprimer un rôle système.');
    }
    await this.roleRepository.remove(role);
  }

  // ================= SEEDER =================
  async seedSystemPermissionsAndRoles() {
    this.logger.log('Seeding System Permissions and Roles...');
    
    // Core Permissions
    const initialPerms = ['manage:users', 'view:audit', 'manage:kyc', 'manage:settings', 'manage:rbac'];
    const savedPerms = [];

    for (const p of initialPerms) {
      let perm = await this.permissionRepository.findOne({ where: { name: p } });
      if (!perm) {
        perm = this.permissionRepository.create({ name: p, description: `Permission système : ${p}` });
        perm = await this.permissionRepository.save(perm);
      }
      savedPerms.push(perm);
    }

    // System Admin Role
    let adminRole = await this.roleRepository.findOne({ where: { name: 'System Admin' } });
    if (!adminRole) {
      adminRole = this.roleRepository.create({
        name: 'System Admin',
        description: 'Administrateur système avec tous les accès RBAC.',
        is_system: true,
        permissions: savedPerms,
      });
      await this.roleRepository.save(adminRole);
    }
  }
}
