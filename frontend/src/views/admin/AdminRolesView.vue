<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Shield, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-vue-next'
import { AppTitle, AppButton, AppCard } from '../../components/ui'
import { 
  getAllRoles, 
  getAllPermissions, 
  createRole, 
  updateRole, 
  deleteRole, 
  type RoleDto, 
  type PermissionDto 
} from '../../services/rbac.service'
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '../../services/http'

const { t } = useI18n()

const roles = ref<RoleDto[]>([])
const permissions = ref<PermissionDto[]>([])
const loading = ref(true)

// Formulaire Modal
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingRoleId = ref<string | null>(null)
const roleLoading = ref(false)
const form = ref({
  name: '',
  description: '',
  permissionIds: [] as string[]
})

async function fetchData() {
  loading.value = true
  try {
    const [rolesData, permsData] = await Promise.all([
      getAllRoles(),
      getAllPermissions()
    ])
    roles.value = rolesData
    permissions.value = permsData
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingRoleId.value = null
  form.value = { name: '', description: '', permissionIds: [] }
  showModal.value = true
}

function openEditModal(role: RoleDto) {
  modalMode.value = 'edit'
  editingRoleId.value = role.id
  form.value = {
    name: role.name,
    description: role.description || '',
    permissionIds: role.permissions.map(p => p.id)
  }
  showModal.value = true
}

async function handleSubmit() {
  if (!form.value.name) return
  roleLoading.value = true
  try {
    if (modalMode.value === 'create') {
      await createRole(form.value)
      toast.success('Rôle créé avec succès')
    } else if (editingRoleId.value) {
      await updateRole(editingRoleId.value, form.value)
      toast.success('Rôle mis à jour')
    }
    showModal.value = false
    await fetchData()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    roleLoading.value = false
  }
}

async function handleDelete(role: RoleDto) {
  if (role.is_system) {
    toast.error('Impossible de supprimer un rôle système')
    return
  }
  if (!confirm(`Supprimer le rôle "${role.name}" ?`)) return
  
  try {
    await deleteRole(role.id)
    toast.success('Rôle supprimé')
    await fetchData()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}

function togglePermission(id: string) {
  const index = form.value.permissionIds.indexOf(id)
  if (index === -1) {
    form.value.permissionIds.push(id)
  } else {
    form.value.permissionIds.splice(index, 1)
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <AppTitle :title="t('admin.rbac.title')" :subtitle="t('admin.rbac.subtitle')">
        <template #icon>
          <Shield class="h-6 w-6 text-[var(--color-accent)]" />
        </template>
      </AppTitle>
      
      <AppButton @click="openCreateModal">
        <Plus class="mr-2 h-4 w-4" />
        Nouveau Rôle
      </AppButton>
    </div>

    <div v-if="loading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent"></div>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <AppCard v-for="role in roles" :key="role.id" class="flex flex-col p-5">
        <template #title>
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-[var(--color-text)]">{{ role.name }}</h3>
              <p class="text-xs text-[var(--color-muted)]" v-if="role.is_system">Rôle Système</p>
            </div>
            <div class="flex gap-1" v-if="!role.is_system">
              <button @click="openEditModal(role)" class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Edit2 class="h-3.5 w-3.5 text-[var(--color-muted)]" />
              </button>
              <button @click="handleDelete(role)" class="rounded p-1 hover:bg-red-50 text-red-500">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </template>
        
        <p class="mt-2 text-sm text-[var(--color-muted)] line-clamp-2 min-h-[2.5rem]">
          {{ role.description || 'Aucune description' }}
        </p>

        <div class="mt-4 flex flex-wrap gap-1.5 flex-grow">
          <span 
            v-for="perm in role.permissions" 
            :key="perm.id"
            class="rounded bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
          >
            {{ perm.name }}
          </span>
          <span v-if="role.permissions.length === 0" class="text-[10px] text-gray-400 italic">
            Aucune permission
          </span>
        </div>
      </AppCard>
    </div>

    <!-- Modal Formulaire -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div class="border-b border-gray-100 p-6 dark:border-gray-700">
          <h3 class="text-lg font-bold text-[var(--color-text)]">
            {{ modalMode === 'create' ? 'Créer un rôle' : 'Modifier le rôle' }}
          </h3>
        </div>
        
        <form @submit.prevent="handleSubmit" class="p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1">
              <label class="text-sm font-medium text-[var(--color-text)]">Nom du rôle</label>
              <input 
                v-model="form.name"
                class="w-full rounded-lg border border-gray-200 p-2.5 text-sm bg-transparent"
                placeholder="Ex: Validateur KYC"
                required
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-[var(--color-text)]">Description</label>
              <input 
                v-model="form.description"
                class="w-full rounded-lg border border-gray-200 p-2.5 text-sm bg-transparent"
                placeholder="Brève description des responsabilités"
              />
            </div>
          </div>

          <div class="mt-6">
            <label class="mb-3 block text-sm font-medium text-[var(--color-text)]">
              Permissions associées ({{ form.permissionIds.length }})
            </label>
            <div class="grid max-h-60 gap-2 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-2 dark:bg-gray-900/50">
              <div 
                v-for="perm in permissions" 
                :key="perm.id"
                class="flex cursor-pointer items-start gap-3 rounded-lg border p-2 transition-colors"
                :class="form.permissionIds.includes(perm.id) 
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' 
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'"
                @click="togglePermission(perm.id)"
              >
                <div class="mt-0.5">
                  <CheckCircle2 
                    class="h-4 w-4" 
                    :class="form.permissionIds.includes(perm.id) ? 'text-[var(--color-accent)]' : 'text-gray-300'"
                  />
                </div>
                <div>
                  <p class="text-xs font-bold text-[var(--color-text)]">{{ perm.name }}</p>
                  <p class="text-[10px] text-[var(--color-muted)]">{{ perm.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-end gap-3">
            <AppButton type="button" variant="ghost" @click="showModal = false">Annuler</AppButton>
            <AppButton type="submit" :loading="roleLoading" :disabled="!form.name">Enregistrer</AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
