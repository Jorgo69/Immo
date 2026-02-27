<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-vue-next'
import { AppTitle, AppButton, AppCard } from '../../components/ui'
import { getUsers, reviewKyc, type AdminUserDto } from '../../services/user.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'

const router = useRouter()

const users = ref<AdminUserDto[]>([])
const loading = ref(true)
const filterStatus = ref<'pending' | 'verified' | 'rejected'>('pending')

const reviewingId = ref<string | null>(null)
const showRejectModal = ref(false)
const rejectTargetId = ref<string | null>(null)
const rejectReason = ref('')
const rejectLoading = ref(false)

async function fetchKycUsers() {
  loading.value = true
  try {
    // On charge tous les users et on filtre côté front par kyc_status
    // (l'endpoint /user/all supporte la pagination, on prend 200 pour avoir une bonne couverture)
    const res = await getUsers({ limit: 200 })
    users.value = res.data.filter(u => {
      const ks = u.profile?.kyc_status
      if (filterStatus.value === 'pending') return !ks || ks === 'pending'
      return ks === filterStatus.value
    })
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
    toast.success('KYC approuvé avec succès ✅')
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
    toast.success('KYC rejeté')
    showRejectModal.value = false
    await fetchKycUsers()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    rejectLoading.value = false
  }
}

function kycStatusClass(status: string | undefined) {
  if (!status || status === 'pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (status === 'verified') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

function kycStatusLabel(status: string | undefined) {
  if (!status || status === 'pending') return 'En attente'
  if (status === 'verified') return 'Vérifié'
  return 'Rejeté'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    agent: 'Agent', landlord: 'Propriétaire', tenant: 'Locataire', admin: 'Admin'
  }
  return map[role] ?? role
}

onMounted(() => fetchKycUsers())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <AppTitle title="Validation KYC" subtitle="Examinez et validez les dossiers d'identité en attente">
        <template #icon>
          <ShieldCheck class="h-6 w-6 text-[var(--color-accent)]" />
        </template>
      </AppTitle>

      <!-- Filtres -->
      <div class="flex rounded-xl border border-gray-200 overflow-hidden text-sm dark:border-gray-700">
        <button
          v-for="filter in [
            { value: 'pending', label: 'En attente', icon: Clock },
            { value: 'verified', label: 'Vérifiés', icon: CheckCircle2 },
            { value: 'rejected', label: 'Rejetés', icon: XCircle }
          ]"
          :key="filter.value"
          class="flex items-center gap-1.5 px-4 py-2 font-medium transition-colors"
          :class="filterStatus === filter.value
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-[var(--color-muted)] hover:bg-gray-50 dark:hover:bg-gray-800'"
          @click="filterStatus = filter.value as any; fetchKycUsers()"
        >
          <component :is="filter.icon" class="h-3.5 w-3.5" />
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Contenu -->
    <div v-if="loading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
    </div>

    <div v-else-if="users.length === 0" class="rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
      <CheckCircle2 class="mx-auto h-12 w-12 text-green-400 mb-3" />
      <p class="text-[var(--color-muted)]">Aucun dossier dans cette catégorie 🎉</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AppCard
        v-for="user in users"
        :key="user.id"
        class="flex flex-col gap-4 p-5"
      >
        <template #title>
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-bold text-[var(--color-text)] truncate">{{ user.phone_number }}</p>
              <p class="text-xs text-[var(--color-muted)] mt-0.5">{{ roleLabel(user.role) }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="rounded-full px-2.5 py-0.5 text-[10px] font-bold" :class="kycStatusClass(user.profile?.kyc_status)">
                {{ kycStatusLabel(user.profile?.kyc_status) }}
              </span>
              <button
                class="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Voir le profil"
                @click="router.push('/admin/users/' + user.id)"
              >
                <ExternalLink class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </template>

        <div class="flex-grow space-y-2 text-xs text-[var(--color-muted)]">
          <div class="flex justify-between">
            <span>Inscrit le</span>
            <span class="font-medium text-[var(--color-text)]">{{ formatDate(user.created_at) }}</span>
          </div>
          <div v-if="user.profile?.kyc_submitted_at" class="flex justify-between">
            <span>Soumis le</span>
            <span class="font-medium text-[var(--color-text)]">{{ formatDate(user.profile.kyc_submitted_at) }}</span>
          </div>
          <div v-if="user.profile?.kyc_rejection_reason" class="rounded-lg bg-red-50 dark:bg-red-900/10 p-2 text-red-700 dark:text-red-400">
            <span class="font-semibold">Motif rejet :</span> {{ user.profile.kyc_rejection_reason }}
          </div>
        </div>

        <!-- Actions (uniquement si pending) -->
        <div v-if="!user.profile?.kyc_status || user.profile?.kyc_status === 'pending'" class="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <AppButton
            size="sm"
            class="flex-1 bg-green-500 hover:bg-green-600 text-white"
            :loading="reviewingId === user.id"
            @click="handleApprove(user.id)"
          >
            <CheckCircle2 class="mr-1 h-3.5 w-3.5" /> Approuver
          </AppButton>
          <AppButton
            size="sm"
            variant="outline"
            class="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            :disabled="reviewingId === user.id"
            @click="openRejectModal(user.id)"
          >
            <XCircle class="mr-1 h-3.5 w-3.5" /> Rejeter
          </AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Modal Rejet -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700">
        <h3 class="mb-1 text-lg font-bold text-[var(--color-text)]">Rejeter le dossier KYC</h3>
        <p class="mb-4 text-sm text-[var(--color-muted)]">Le motif sera communiqué à l'utilisateur et enregistré dans l'audit.</p>
        <textarea
          v-model="rejectReason"
          class="w-full rounded-xl border border-gray-200 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-gray-700"
          placeholder="Motif du rejet (obligatoire)…"
          rows="3"
        />
        <div class="mt-4 flex justify-end gap-3">
          <AppButton variant="ghost" @click="showRejectModal = false">Annuler</AppButton>
          <AppButton
            class="bg-red-500 hover:bg-red-600 text-white"
            :loading="rejectLoading"
            :disabled="!rejectReason.trim()"
            @click="confirmReject"
          >
            Confirmer le rejet
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
