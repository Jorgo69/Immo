<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShieldCheck, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-vue-next'
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

const reviewingId = ref<string | null>(null)
const showRejectModal = ref(false)
const rejectTargetId = ref<string | null>(null)
const rejectReason = ref('')
const rejectLoading = ref(false)

/** Filtre côté serveur :
 * - "pending"  → is_verified = false  : TOUS les non-validés (avec ou sans profil)
 * - "verified" → is_verified = true   : Validés par l'admin
 * - "rejected" → kycStatus = rejected : Dossiers explicitement refusés
 */
async function fetchKycUsers() {
  loading.value = true
  try {
    let filters: Record<string, unknown> = { limit: 100 }

    if (filterStatus.value === 'pending') {
      filters.isVerified = false
    } else if (filterStatus.value === 'verified') {
      filters.isVerified = true
    } else {
      // rejected : basé sur le statut kyc du profil
      filters.kycStatus = 'rejected'
    }

    const res = await getUsers(filters)
    // Afficher uniquement agents et propriétaires (KYC obligatoire pour eux)
    users.value = res.data.filter(u => u.role === 'agent' || u.role === 'landlord')
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

      <!-- Filtres statut -->
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

            <!-- Badge KYC + lien -->
            <div class="flex shrink-0 items-center gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                :class="kycBadgeClass(user.profile?.kyc_status)"
              >
                {{ kycStatusLabel(user.profile?.kyc_status) }}
              </span>
              <button
                class="rounded-lg p-1.5 text-ui-muted transition-colors hover:bg-ui-background dark:hover:bg-brand-dark"
                :title="t('kyc.viewProfile')"
                @click="router.push('/admin/users/' + user.id)"
              >
                <ExternalLink class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </template>

        <!-- Rôle + dates -->
        <div class="flex-grow space-y-2 text-xs text-ui-muted">
          <div>
            <span class="font-bold uppercase tracking-widest text-[10px] text-primary-emerald">
              {{ roleLabel(user.role) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>{{ t('kyc.registeredOn') }}</span>
            <span class="font-medium text-[var(--color-text)]">{{ formatDate(user.created_at) }}</span>
          </div>
          <div v-if="user.profile?.kyc_submitted_at" class="flex justify-between">
            <span>{{ t('kyc.submittedOn') }}</span>
            <span class="font-medium text-[var(--color-text)]">{{ formatDate(user.profile.kyc_submitted_at) }}</span>
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
