<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShieldCheck, CheckCircle2, XCircle, Clock, ExternalLink, Eye, ArrowUpDown, Search, Filter, Users } from 'lucide-vue-next'
import { AppTitle, AppButton, AppCard, AppDataView, AppDataFilters, AppDataGrid } from '../../components/ui'
import type { FilterDef } from '../../components/ui/AppDataFilters.vue'
import { getUsers, reviewKyc, type AdminUserDto } from '../../services/user.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const router = useRouter()

const users = ref<AdminUserDto[]>([])
const total = ref(0)
const loading = ref(true)
const filterStatus = ref<'pending' | 'verified' | 'rejected'>('pending')

// Filtres avancés via AppDataFilters
const advancedFilters = ref({
  search: '',
  role: 'all',
  sortBy: 'created_at',
  sortOrder: 'DESC',
})

const filterDefs = computed<FilterDef[]>(() => [
  { type: 'search', key: 'search', placeholder: t('kyc.searchPlaceholder'), icon: Search },
  {
    type: 'select', key: 'role', icon: Users,
    options: [
      { value: 'all', label: t('kyc.roleAll') },
      { value: 'tenant', label: t('kyc.role.tenant') },
      { value: 'landlord', label: t('kyc.role.landlord') },
      { value: 'agent', label: t('kyc.role.agent') },
    ]
  },
  {
    type: 'sort', key: 'sortBy', icon: ArrowUpDown,
    options: [
      { value: 'created_at', label: t('kyc.sortDate') },
      { value: 'completion_score', label: t('kyc.sortCompletion') },
    ]
  },
  {
    type: 'toggle', key: 'sortOrder', icon: Filter,
    labelOn: t('kyc.sortDesc'), labelOff: t('kyc.sortAsc')
  },
])

const reviewingId = ref<string | null>(null)
const showRejectModal = ref(false)
const rejectTargetId = ref<string | null>(null)
const rejectReason = ref('')
const rejectLoading = ref(false)

async function fetchKycUsers() {
  loading.value = true
  try {
    const filters: Record<string, unknown> = { limit: 100 }

    if (filterStatus.value === 'pending') {
      filters.isVerified = false
    } else if (filterStatus.value === 'verified') {
      filters.isVerified = true
    } else {
      filters.kycStatus = 'rejected'
    }

    filters.sortBy = advancedFilters.value.sortBy
    filters.sortOrder = advancedFilters.value.sortOrder

    if (advancedFilters.value.search.trim()) {
      filters.search = advancedFilters.value.search.trim()
    }

    if (advancedFilters.value.role !== 'all') {
      filters.role = advancedFilters.value.role
    }

    const res = await getUsers(filters)
    users.value = res.data.filter(u => 
      u.role === 'agent' || 
      u.role === 'landlord' || 
      (u.role === 'tenant' && u.is_profile_complete)
    )
    total.value = users.value.length
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    loading.value = false
  }
}

function onFiltersChange() {
  fetchKycUsers()
}

async function handleApprove(userId: string) {
  reviewingId.value = userId
  try {
    await reviewKyc(userId, 'approve')
    toast.success(t('kyc.approvedSuccess'))
    await fetchKycUsers()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    reviewingId.value = null
  }
}

function openRejectModal(userId: string) {
  rejectTargetId.value = userId
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectTargetId.value || !rejectReason.value.trim()) return
  rejectLoading.value = true
  try {
    await reviewKyc(rejectTargetId.value, 'reject', rejectReason.value)
    toast.success(t('kyc.rejectedSuccess'))
    showRejectModal.value = false
    await fetchKycUsers()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    rejectLoading.value = false
  }
}

function kycBadgeClass(status: string | undefined) {
  if (!status || status === 'pending') return 'bg-warning-orange-light text-warning-orange'
  if (status === 'verified') return 'bg-primary-emerald-light text-primary-emerald'
  return 'bg-red-100 text-danger-red'
}

function kycStatusLabel(status: string | undefined) {
  if (!status || status === 'pending') return t('kyc.statusPending')
  if (status === 'verified') return t('kyc.statusVerified')
  return t('kyc.statusRejected')
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function roleLabel(role: string) {
  return t(`kyc.role.${role}`, role)
}

function avatarInitials(user: AdminUserDto): string {
  const fn = user.first_name?.trim()
  const ln = user.last_name?.trim()
  if (fn && ln) return (fn[0] + ln[0]).toUpperCase()
  if (fn) return fn.slice(0, 2).toUpperCase()
  return user.phone_number.slice(-2)
}

function openIdCard(url: string | null) {
  if (url) window.open(url, '_blank')
}

function getCompletionStats(user: AdminUserDto) {
  const fields = [
    { label: t('kyc.checkIdentity'), value: !!(user.first_name && user.last_name) },
    { label: t('kyc.checkIdCard'), value: !!user.id_card_url },
    { label: t('kyc.checkEmail'), value: !!user.email },
    { label: t('kyc.checkAvatar'), value: !!user.avatar_url },
    { label: t('kyc.checkOnboarding'), value: user.is_profile_complete },
  ]
  const filledCount = fields.filter(f => f.value).length
  const percent = Math.round((filledCount / fields.length) * 100)
  return { fields, percent, isFullyComplete: percent === 100 }
}

onMounted(() => fetchKycUsers())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <AppTitle :title="t('kyc.title')" :subtitle="t('kyc.subtitle')">
        <template #icon>
          <ShieldCheck class="h-6 w-6 text-primary-emerald" />
        </template>
      </AppTitle>

      <!-- Filtres statut KYC -->
      <div class="flex overflow-hidden rounded-xl border border-ui-border text-sm dark:border-ui-border-dark">
        <button
          v-for="filter in [
            { value: 'pending', label: t('kyc.filterPending'), icon: Clock },
            { value: 'verified', label: t('kyc.filterVerified'), icon: CheckCircle2 },
            { value: 'rejected', label: t('kyc.filterRejected'), icon: XCircle },
          ]"
          :key="filter.value"
          class="flex items-center gap-1.5 px-4 py-2 font-medium transition-colors"
          :class="filterStatus === filter.value
            ? 'bg-primary-emerald text-white'
            : 'text-ui-muted hover:bg-ui-background dark:hover:bg-brand-dark'"
          @click="filterStatus = filter.value as typeof filterStatus; fetchKycUsers()"
        >
          <component :is="filter.icon" class="h-3.5 w-3.5" />
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- AppDataView : loading, empty, compteur, contenu -->
    <AppDataView
      :loading="loading"
      :empty="users.length === 0"
      :empty-label="t('kyc.empty')"
      :empty-icon="CheckCircle2"
      :total="total"
      :modes="['grid']"
      view-mode="grid"
    >
      <!-- Barre de filtres avancés via AppDataFilters -->
      <template #toolbar>
        <AppDataFilters
          :filters="filterDefs"
          v-model="advancedFilters"
          @change="onFiltersChange"
        />
      </template>

      <!-- Grille via AppDataGrid -->
      <template #grid>
        <AppDataGrid :items="users" :cols="3" gap="md" item-key="id">
          <template #item="{ item: user }">
            <AppCard class="flex flex-col gap-4 p-5">
              <template #title>
                <div class="flex items-start justify-between gap-2">
                  <!-- Avatar + identité -->
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="relative shrink-0">
                      <img
                        v-if="user.avatar_url"
                        :src="user.avatar_url"
                        :alt="user.phone_number"
                        class="h-10 w-10 rounded-full object-cover ring-2 ring-primary-emerald/30"
                      />
                      <div
                        v-else
                        class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-emerald-light text-sm font-bold text-primary-emerald"
                      >
                        {{ avatarInitials(user) }}
                      </div>
                      <span
                        v-if="user.is_verified"
                        class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-emerald text-white"
                        :title="t('kyc.statusVerified')"
                      >
                        <CheckCircle2 class="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-bold text-[var(--color-text)]">
                        {{ (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : user.phone_number }}
                      </p>
                      <p class="text-xs text-ui-muted">{{ user.phone_number }}</p>
                    </div>
                  </div>

                  <!-- Badge KYC + actions -->
                  <div class="flex shrink-0 items-center gap-1.5">
                    <span
                      class="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      :class="kycBadgeClass(user.profile?.kyc_status)"
                    >
                      {{ kycStatusLabel(user.profile?.kyc_status) }}
                    </span>
                    <button
                      v-if="user.id_card_url"
                      class="rounded-lg p-1 text-ui-muted transition-colors hover:bg-ui-background hover:text-primary-emerald dark:hover:bg-brand-dark"
                      :title="t('kyc.viewIdCard')"
                      @click="openIdCard(user.id_card_url)"
                    >
                      <Eye class="h-3.5 w-3.5" />
                    </button>
                    <button
                      class="rounded-lg p-1 text-ui-muted transition-colors hover:bg-ui-background hover:text-primary-emerald dark:hover:bg-brand-dark"
                      :title="t('kyc.viewProfile')"
                      @click="router.push('/portal/users/' + user.id)"
                    >
                      <ExternalLink class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </template>

              <!-- Rôle + checklist + dates -->
              <div class="flex-grow space-y-4 text-xs text-ui-muted">
                <div>
                  <span class="font-bold uppercase tracking-widest text-[10px] text-primary-emerald">
                    {{ roleLabel(user.role) }}
                  </span>
                </div>

                <!-- Checklist de complétude -->
                <div class="space-y-1.5 rounded-xl bg-gray-50/50 p-3 border border-gray-100 dark:bg-white/5 dark:border-white/5">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-[10px] uppercase text-[var(--color-text)]">{{ t('kyc.checklistTitle') }}</span>
                    <span class="font-black text-primary-emerald">{{ getCompletionStats(user).percent }}%</span>
                  </div>
                  <div v-for="(f, i) in getCompletionStats(user).fields" :key="i" class="flex items-center gap-2">
                    <div class="h-1.5 w-1.5 rounded-full" :class="f.value ? 'bg-primary-emerald' : 'bg-gray-300 dark:bg-gray-700'" />
                    <span :class="f.value ? 'text-gray-900 dark:text-gray-100' : 'text-ui-muted italic line-through decoration-1 opacity-50'">
                      {{ f.label }}
                    </span>
                  </div>
                </div>

                <div class="space-y-1 pt-1">
                  <div class="flex justify-between">
                    <span>{{ t('kyc.registeredOn') }}</span>
                    <span class="font-medium text-[var(--color-text)]">{{ formatDate(user.created_at) }}</span>
                  </div>
                  <div v-if="user.profile?.kyc_submitted_at" class="flex justify-between">
                    <span>{{ t('kyc.submittedOn') }}</span>
                    <span class="font-medium text-[var(--color-text)]">{{ formatDate(user.profile.kyc_submitted_at) }}</span>
                  </div>
                </div>

                <div v-if="user.profile?.kyc_rejection_reason" class="rounded-lg bg-red-50 p-2 text-danger-red dark:bg-red-900/10">
                  <span class="font-semibold">{{ t('kyc.rejectionReason') }} :</span>
                  {{ user.profile.kyc_rejection_reason }}
                </div>
              </div>

              <!-- Actions Approuver / Rejeter -->
              <div
                v-if="!user.profile?.kyc_status || user.profile?.kyc_status === 'pending'"
                class="flex gap-2 border-t border-ui-border pt-3 dark:border-ui-border-dark"
              >
                <AppButton
                  size="sm"
                  class="flex-1 bg-primary-emerald hover:bg-primary-emerald/90 text-white"
                  :loading="reviewingId === user.id"
                  @click="handleApprove(user.id)"
                >
                  <CheckCircle2 class="mr-1 h-3.5 w-3.5" />
                  {{ t('kyc.approve') }}
                </AppButton>
                <AppButton
                  size="sm"
                  variant="outline"
                  class="flex-1 border-danger-red/30 text-danger-red hover:bg-red-50"
                  :disabled="reviewingId === user.id"
                  @click="openRejectModal(user.id)"
                >
                  <XCircle class="mr-1 h-3.5 w-3.5" />
                  {{ t('kyc.reject') }}
                </AppButton>
              </div>
            </AppCard>
          </template>
        </AppDataGrid>
      </template>
    </AppDataView>

    <!-- Modal Rejet -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="fixed inset-0 z-modal flex items-center justify-center bg-overlay p-4">
        <div class="w-full max-w-modal rounded-3xl bg-ui-surface p-6 shadow-glass dark:bg-brand-dark dark:border dark:border-ui-border-dark">
          <h3 class="mb-1 text-lg font-bold text-[var(--color-text)]">{{ t('kyc.rejectModalTitle') }}</h3>
          <p class="mb-4 text-sm text-ui-muted">{{ t('kyc.rejectModalSubtitle') }}</p>
          <textarea
            v-model="rejectReason"
            class="w-full rounded-xl border border-ui-border bg-transparent p-3 text-sm outline-none ring-danger-red focus:ring-2 dark:border-ui-border-dark"
            :placeholder="t('kyc.rejectReasonPlaceholder')"
            rows="3"
          />
          <div class="mt-4 flex justify-end gap-3">
            <AppButton variant="ghost" @click="showRejectModal = false">{{ t('kyc.cancel') }}</AppButton>
            <AppButton
              class="bg-danger-red hover:bg-danger-red/90 text-white"
              :loading="rejectLoading"
              :disabled="!rejectReason.trim()"
              @click="confirmReject"
            >
              {{ t('kyc.confirmReject') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
