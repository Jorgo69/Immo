import { http } from './http'

export interface PermissionDto {
  id: string
  name: string
  description?: string
}

export interface RoleDto {
  id: string
  name: string
  description?: string
  is_system: boolean
  permissions: PermissionDto[]
  created_at: string
}

export interface CreateRoleDto {
  name: string
  description?: string
  permissionIds: string[]
}

export interface UpdateRoleDto {
  name?: string
  description?: string
  permissionIds?: string[]
}

export async function getAllPermissions(): Promise<PermissionDto[]> {
  const { data } = await http.get<PermissionDto[]>('/rbac/permissions')
  return data
}

export async function getAllRoles(): Promise<RoleDto[]> {
  const { data } = await http.get<RoleDto[]>('/rbac/roles')
  return data
}

export async function getRoleById(id: string): Promise<RoleDto> {
  const { data } = await http.get<RoleDto>(`/rbac/roles/${id}`)
  return data
}

export async function createRole(dto: CreateRoleDto): Promise<RoleDto> {
  const { data } = await http.post<RoleDto>('/rbac/roles', dto)
  return data
}

export async function updateRole(id: string, dto: UpdateRoleDto): Promise<RoleDto> {
  const { data } = await http.patch<RoleDto>(`/rbac/roles/${id}`, dto)
  return data
}

export async function deleteRole(id: string): Promise<void> {
  await http.delete(`/rbac/roles/${id}`)
}
