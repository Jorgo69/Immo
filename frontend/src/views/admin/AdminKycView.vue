<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShieldCheck, CheckCircle2, XCircle, Clock, ExternalLink, Eye, ArrowUpDown, Search, Filter, Users } from 'lucide-vue-next'
import { AppTitle, AppButton, AppCard } from '../../components/ui'
import { getUsers, reviewKyc, type AdminUserDto } from '../../services/user.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const router = useRouter()

const users = ref<AdminUserDto[]>([])
const total = ref(0)
const loading = ref(true)
const filterStatus = ref<'pending' | 'verified' | 'rejected'>('pending')

// Filtres avancés
const sortBy = ref<'created_at' | 'completion_score'>('created_at')
const sortOrder = ref<'DESC' | 'ASC'>('DESC')
const roleFilter = ref<string>('all') // 'all', 'tenant', 'landlord', 'agent'
const searchQuery = ref('')

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

    // Tri
    filters.sortBy = sortBy.value
    filters.sortOrder = sortOrder.value

    // Recherche
    if (searchQuery.value.trim()) {
      filters.search = searchQuery.value.trim()
    }

    // Filtre par rôle
    if (roleFilter.value !== 'all') {
      filters.role = roleFilter.value
    }

    const res = await getUsers(filters)
    // Afficher agents, propriétaires ET locataires ayant complété l'onboarding
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
  
  return {
    fields,
    percent,
    isFullyComplete: percent === 100
  }
}

// Debounce de recherche
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchKycUsers(), 400)
})

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

    <!-- Barre de filtres avancés -->
    <div class="flex flex-wrap items-center gap-3 rounded-2xl bg-ui-background/50 p-3 border border-ui-border/50 dark:bg-brand-dark/50 dark:border-ui-border-dark/50">
      <!-- Recherche -->
      <div class="relative flex-1 min-w-[200px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-muted" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('kyc.searchPlaceholder')"
          class="w-full rounded-xl border border-ui-border bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary-emerald focus:ring-2 focus:ring-primary-emerald/20 dark:bg-brand-dark dark:border-ui-border-dark dark:text-white"
        />
      </div>

      <!-- Filtre par rôle -->
      <div class="flex items-center gap-1.5">
        <Users class="h-4 w-4 text-ui-muted shrink-0" />
        <select
          v-model="roleFilter"
          class="rounded-xl border border-ui-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary-emerald cursor-pointer dark:bg-brand-dark dark:border-ui-border-dark dark:text-white"
          @change="fetchKycUsers()"
        >
          <option value="all">{{ t('kyc.roleAll') }}</option>
          <option value="tenant">{{ t('kyc.role.tenant') }}</option>
          <option value="landlord">{{ t('kyc.role.landlord') }}</option>
          <option value="agent">{{ t('kyc.role.agent') }}</option>
        </select>
      </div>

      <!-- Tri -->
      <div class="flex items-center gap-1.5">
        <ArrowUpDown class="h-4 w-4 text-ui-muted shrink-0" />
        <select
          v-model="sortBy"
          class="rounded-xl border border-ui-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary-emerald cursor-pointer dark:bg-brand-dark dark:border-ui-border-dark dark:text-white"
          @change="fetchKycUsers()"
        >
          <option value="created_at">{{ t('kyc.sortDate') }}</option>
          <option value="completion_score">{{ t('kyc.sortCompletion') }}</option>
        </select>
      </div>

      <!-- Ordre -->
      <button
        class="flex items-center gap-1 rounded-xl border border-ui-border bg-white px-3 py-2 text-sm font-medium transition-all hover:bg-ui-background dark:bg-brand-dark dark:border-ui-border-dark dark:text-white"
        @click="sortOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC'; fetchKycUsers()"
      >
        <Filter class="h-3.5 w-3.5" />
        {{ sortOrder === 'DESC' ? t('kyc.sortDesc') : t('kyc.sortAsc') }}
      </button>
    </div>

    <!-- Compteur -->
    <p v-if="!loading" class="text-sm text-ui-muted">
      {{ t('kyc.totalResults', { count: total }) }}
    </p>

    <!-- Chargement -->
    <div v-if="loading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-emerald border-t-transparent" />
    </div>

    <!-- Vide -->
    <div v-else-if="users.length === 0" class="rounded-2xl border border-dashed border-ui-border py-16 text-center dark:border-ui-border-dark">
      <CheckCircle2 class="mx-auto mb-3 h-12 w-12 text-primary-emerald" />
      <p class="text-ui-muted">{{ t('kyc.empty') }}</p>
    </div>

    <!-- Grille des dossiers -->
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AppCard
        v-for="user in users"
        :key="user.id"
        class="flex flex-col gap-4 p-5"
      >
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

            <!-- Badge KYC + lien profile + aperçu ID -->
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

        <!-- Rôle + dates -->
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
               <div class="h-1.5 w-1.5 rounded-full" :class="f.value ? 'bg-primary-emerald' : 'bg-gray-300 dark:bg-gray-700'"></div>
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

        <!-- Actions Approuver / Rejeter (pending uniquement) -->
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
    </div>

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
