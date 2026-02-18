<script setup lang="ts">
/**
 * Liste des utilisateurs (admin) : filtres (rôle, statut), tableau. Clic sur une ligne → page dédiée /admin/users/:id.
 */
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, ChevronRight, Search } from 'lucide-vue-next'
import { getUsers, type AdminUserDto, type UserRole } from '../../services/user.service'
import { AppTitle, AppButton, AppCard } from '../../components/ui'
import { AppPagination } from '../../components/ui'

const { t } = useI18n()
const router = useRouter()

const PAGE_SIZE = 15
const users = ref<AdminUserDto[]>([])
const total = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const loading = ref(true)
const filterRole = ref<UserRole | ''>('')
const filterStatus = ref<'all' | true | false>('all')
const searchQuery = ref('')

const roleOptions: { value: '' | UserRole; labelKey: string }[] = [
  { value: '', labelKey: 'admin.users.filterRoleAll' },
  { value: 'tenant', labelKey: 'admin.users.roleTenant' },
  { value: 'landlord', labelKey: 'admin.users.roleLandlord' },
  { value: 'agent', labelKey: 'admin.users.roleAgent' },
  { value: 'admin', labelKey: 'admin.users.roleAdmin' },
]

async function fetchList(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const result = await getUsers({
      page,
      limit: PAGE_SIZE,
      role: filterRole.value || undefined,
      is_active: filterStatus.value === 'all' ? undefined : filterStatus.value,
      search: searchQuery.value.trim() || undefined,
    })
    users.value = result.data
    total.value = result.total
    totalPages.value = result.totalPages
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  fetchList(1)
}

watch([filterRole, filterStatus], () => {
  applyFilters()
})

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => applyFilters(), 300)
})

function roleLabel(role: UserRole): string {
  return t(`admin.users.role${role.charAt(0).toUpperCase() + role.slice(1)}` as 'admin.users.roleTenant')
}

function statusLabel(active: boolean): string {
  return active ? t('admin.users.statusActive') : t('admin.users.statusInactive')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function openDetail(user: AdminUserDto) {
  router.push({ name: 'admin-user-detail', params: { id: user.id } })
}

fetchList(1)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <AppTitle :level="2">{{ t('admin.users.title') }}</AppTitle>
    </div>

    <!-- Barre de recherche + Filtres -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex flex-1 min-w-[200px] flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.users.searchLabel') }}</label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('admin.users.searchPlaceholder')"
            class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.users.filterRole') }}</label>
        <select
          v-model="filterRole"
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option v-for="opt in roleOptions" :key="String(opt.value)" :value="opt.value">
            {{ t(opt.labelKey) }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.users.filterStatus') }}</label>
        <select
          v-model="filterStatus"
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="all">{{ t('admin.users.filterStatusAll') }}</option>
          <option :value="true">{{ t('admin.users.filterStatusActive') }}</option>
          <option :value="false">{{ t('admin.users.filterStatusInactive') }}</option>
        </select>
      </div>
    </div>

    <!-- Tableau -->
    <AppCard class="overflow-hidden p-0">
      <div v-if="loading" class="p-8 text-center text-[var(--color-muted)] text-sm">
        {{ t('admin.users.loading') }}
      </div>
      <div v-else-if="!users.length" class="p-8 text-center text-[var(--color-muted)] text-sm">
        {{ t('admin.users.empty') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.users.tablePhone') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.users.tableRole') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.users.tableStatus') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.users.tableCreated') }}</th>
              <th class="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="u in users"
              :key="u.id"
              class="cursor-pointer transition-colors hover:bg-gray-50"
              @click="openDetail(u)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <!-- Avatar par défaut (icône) ; plus tard image si dispo -->
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[var(--color-muted)]"
                  >
                    <User class="h-5 w-5" />
                  </div>
                  <span class="font-medium text-[var(--color-text)]">{{ u.phone_number }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-emerald-100 text-emerald-800': u.role === 'admin',
                    'bg-blue-100 text-blue-800': u.role === 'agent',
                    'bg-amber-100 text-amber-800': u.role === 'landlord',
                    'bg-gray-100 text-gray-700': u.role === 'tenant',
                  }"
                >
                  {{ roleLabel(u.role) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ statusLabel(u.is_active) }}
                </span>
              </td>
              <td class="px-4 py-3 text-[var(--color-muted)]">
                {{ formatDate(u.created_at) }}
              </td>
              <td class="px-4 py-3">
                <AppButton variant="ghost" size="sm" class="text-[var(--color-accent)]" @click.stop="openDetail(u)">
                  <ChevronRight class="h-4 w-4" />
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="total > PAGE_SIZE" class="border-t border-gray-100 p-3">
        <AppPagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          :limit="PAGE_SIZE"
          @page-change="fetchList"
        />
      </div>
    </AppCard>
  </div>
</template>
