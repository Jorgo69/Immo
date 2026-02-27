<script setup lang="ts">
/**
 * Page dédiée détail utilisateur (admin) : fil d’Ariane, carte user, stats selon rôle, historique transactions, connexion/sécurité (placeholder).
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, ArrowLeft, Building2, DoorOpen, Wallet, Receipt, Shield } from 'lucide-vue-next'
import {
  getUserDetail,
  getUserDetailTransactions,
  changeUserStatus,
  reviewKyc,
  assignRbacRoleToUser,
  type AdminUserDto,
  type UserRole,
  type UserDetailResultDto,
  type PaginatedTransactionsResult,
} from '../../services/user.service'
import { getAllRoles, type RoleDto } from '../../services/rbac.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppButton, AppCard } from '../../components/ui'
import AppLink from '../../components/ui/AppLink.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)
const detail = ref<UserDetailResultDto | null>(null)
const transactions = ref<PaginatedTransactionsResult | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const transactionsLoading = ref(false)
const kycReviewing = ref(false)
const rejectionReason = ref('')

const roles = ref<RoleDto[]>([])
const showRoleModal = ref(false)
const selectedRoleId = ref<string | null>(null)
const roleReason = ref('')
const roleChanging = ref(false)

const showStatusModal = ref(false)
const targetStatus = ref<'active' | 'restricted' | 'banned'>('active')
const statusReason = ref('')
const statusChanging = ref(false)

const user = computed<AdminUserDto | null>(() => detail.value?.user ?? null)
const stats = computed(() => detail.value?.stats ?? null)

function roleLabel(role: UserRole): string {
  return t(`admin.users.role${role.charAt(0).toUpperCase() + role.slice(1)}` as 'admin.users.roleTenant')
}

function statusLabel(status: string): string {
  if (status === 'active') return 'Actif'
  if (status === 'restricted') return 'Restreint'
  if (status === 'banned') return 'Banni'
  return 'Inconnu'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(Number(amount)) + ' FCFA'
}

async function fetchDetail() {
  if (!id.value) return
  loading.value = true
  error.value = null
  try {
    detail.value = await getUserDetail(id.value)
    if (detail.value?.user?.role === 'tenant') {
      transactionsLoading.value = true
      transactions.value = await getUserDetailTransactions(id.value, 1, 10)
    } else {
      transactions.value = null
    }
  } catch (e: unknown) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg || t('admin.userDetail.errorLoad')
  } finally {
    loading.value = false
    transactionsLoading.value = false
  }
}

async function fetchRoles() {
  try {
    roles.value = await getAllRoles()
  } catch (err) {
    console.error('Erreur chargement rôles:', err)
  }
}

async function handleKycReview(action: 'approve' | 'reject') {
  if (!user.value?.id) return
  if (action === 'reject' && !rejectionReason.value.trim()) {
    toast.error(t('admin.userDetail.kycReasonRequired'))
    return
  }

  kycReviewing.value = true
  try {
    await reviewKyc(user.value.id, action, action === 'reject' ? rejectionReason.value.trim() : undefined)
    toast.success(action === 'approve' ? t('admin.userDetail.kycApproved') : t('admin.userDetail.kycRejected'))
    rejectionReason.value = ''
    await fetchDetail()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    kycReviewing.value = false
  }
}

function openStatusModal(newStatus: 'active' | 'restricted' | 'banned') {
  targetStatus.value = newStatus
  statusReason.value = ''
  showStatusModal.value = true
}

async function confirmStatusChange() {
  if (!id.value || !statusReason.value.trim()) return
  statusChanging.value = true
  try {
    const updatedUser = await changeUserStatus(id.value, targetStatus.value, statusReason.value)
    if (detail.value) detail.value.user = updatedUser
    toast.success('Statut du compte mis à jour.')
    showStatusModal.value = false
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    statusChanging.value = false
  }
}

function goBack() {
  router.push({ name: 'admin-users' })
}

function openRoleModal() {
  selectedRoleId.value = user.value?.rbac_role?.id || null
  roleReason.value = ''
  showRoleModal.value = true
}

async function confirmRoleChange() {
  if (!id.value || !roleReason.value.trim()) return
  roleChanging.value = true
  try {
    const updatedUser = await assignRbacRoleToUser(id.value, selectedRoleId.value, roleReason.value)
    if (detail.value) detail.value.user = updatedUser
    toast.success('Rôle RBAC mis à jour.')
    showRoleModal.value = false
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    roleChanging.value = false
  }
}



onMounted(() => {
  fetchDetail()
  fetchRoles()
})
watch(id, () => {
  fetchDetail()
  fetchRoles()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Fil d’Ariane + Retour -->
    <div class="flex flex-wrap items-center gap-3">
      <AppButton variant="ghost" size="sm" :aria-label="t('admin.userDetail.back')" @click="goBack">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <nav class="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <AppLink :to="{ name: 'admin-users' }" class="hover:text-[var(--color-accent)]">
          {{ t('admin.users.title') }}
        </AppLink>
        <span aria-hidden="true">/</span>
        <span class="font-medium text-[var(--color-text)]">{{ t('admin.userDetail.breadcrumb') }}</span>
      </nav>
    </div>

    <AppTitle :level="2">{{ t('admin.users.detailTitle') }}</AppTitle>

    <div v-if="loading" class="py-12 text-center text-[var(--color-muted)] text-sm">
      {{ t('admin.users.loading') }}
    </div>
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
      <AppButton variant="ghost" size="sm" class="mt-2" @click="fetchDetail">
        {{ t('admin.userDetail.retry') }}
      </AppButton>
    </div>
    <template v-else-if="user && stats">
      <!-- Carte utilisateur -->
      <AppCard class="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50/50 p-6 text-center">
        <div
          class="mb-3 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[var(--color-muted)]"
        >
          <User class="h-8 w-8" />
        </div>
        <p class="font-semibold text-[var(--color-text)]">{{ user.phone_number }}</p>
        <p class="mt-1 text-sm text-[var(--color-muted)]">{{ roleLabel(user.role) }}</p>
        <p class="mt-0.5 text-xs text-[var(--color-muted)]">
          {{ t('admin.users.detailLang') }} : {{ user.preferred_lang }}
        </p>
        <span
          class="mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="{
            'bg-green-100 text-green-800': user.status === 'active',
            'bg-amber-100 text-amber-800': user.status === 'restricted',
            'bg-red-100 text-red-800': user.status === 'banned'
          }"
        >
          {{ statusLabel(user.status) }}
        </span>
        <p class="mt-2 text-xs text-[var(--color-muted)]">
          {{ t('admin.users.tableCreated') }} : {{ formatDate(user.created_at) }}
        </p>
      </AppCard>

      <!-- Stats selon rôle -->
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Propriétaire : biens + chambres -->
        <AppCard v-if="user.role === 'landlord' || user.role === 'admin'" class="p-4">
          <template #title>
            <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <Building2 class="h-4 w-4 text-[var(--color-accent)]" />
              {{ t('admin.userDetail.statsAsOwner') }}
            </span>
          </template>
          <p class="text-2xl font-semibold text-[var(--color-text)]">{{ stats.propertiesAsOwnerCount }}</p>
          <p class="text-sm text-[var(--color-muted)]">{{ t('admin.userDetail.propertiesCount') }}</p>
          <p class="mt-2 text-2xl font-semibold text-[var(--color-text)]">{{ stats.roomsAsOwnerCount }}</p>
          <p class="text-sm text-[var(--color-muted)]">{{ t('admin.userDetail.roomsCount') }}</p>
        </AppCard>

        <!-- Agent : biens gérés + chambres -->
        <AppCard v-if="user.role === 'agent' || user.role === 'admin'" class="p-4">
          <template #title>
            <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <DoorOpen class="h-4 w-4 text-[var(--color-accent)]" />
              {{ t('admin.userDetail.statsAsAgent') }}
            </span>
          </template>
          <p class="text-2xl font-semibold text-[var(--color-text)]">{{ stats.propertiesAsAgentCount }}</p>
          <p class="text-sm text-[var(--color-muted)]">{{ t('admin.userDetail.propertiesCount') }}</p>
          <p class="mt-2 text-2xl font-semibold text-[var(--color-text)]">{{ stats.roomsAsAgentCount }}</p>
          <p class="text-sm text-[var(--color-muted)]">{{ t('admin.userDetail.roomsCount') }}</p>
        </AppCard>

        <!-- Locataire : tirelire + historique -->
        <AppCard v-if="user.role === 'tenant'" class="p-4">
          <template #title>
            <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <Wallet class="h-4 w-4 text-[var(--color-accent)]" />
              {{ t('admin.userDetail.wallet') }}
            </span>
          </template>
          <p class="text-lg font-semibold text-[var(--color-text)]">
            {{ stats.walletBalanceTotal != null ? formatAmount(stats.walletBalanceTotal) : '—' }}
          </p>
          <p class="text-sm text-[var(--color-muted)]">{{ t('admin.userDetail.balanceTotal') }}</p>
          <p class="mt-2 text-lg font-semibold text-[var(--color-text)]">
            {{ stats.walletBalanceSavings != null ? formatAmount(stats.walletBalanceSavings) : '—' }}
          </p>
          <p class="text-sm text-[var(--color-muted)]">{{ t('admin.userDetail.balanceSavings') }}</p>
          <p class="mt-2 text-sm text-[var(--color-muted)]">
            {{ t('admin.userDetail.transactionsCount') }} : {{ stats.transactionsCount }}
          </p>
          <p v-if="stats.lastTransactionAt" class="text-xs text-[var(--color-muted)]">
            {{ t('admin.userDetail.lastTransaction') }} : {{ formatDate(stats.lastTransactionAt) }}
          </p>
        </AppCard>
      </div>

      <!-- Historique transactions (locataire) -->
      <AppCard v-if="user.role === 'tenant'">
        <template #title>
          <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
            <Receipt class="h-4 w-4 text-[var(--color-accent)]" />
            {{ t('admin.userDetail.historyTransactions') }}
          </span>
        </template>
        <div v-if="transactionsLoading" class="py-4 text-center text-sm text-[var(--color-muted)]">
          {{ t('admin.users.loading') }}
        </div>
        <div v-else-if="transactions?.data?.length" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-[var(--color-muted)]">
              <tr>
                <th class="px-3 py-2 font-medium">{{ t('admin.userDetail.txDate') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.userDetail.txType') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.userDetail.txAmount') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.userDetail.txStatus') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="tx in transactions.data" :key="tx.id" class="text-[var(--color-text)]">
                <td class="px-3 py-2">{{ formatDate(tx.created_at) }}</td>
                <td class="px-3 py-2">{{ tx.type }}</td>
                <td class="px-3 py-2">{{ formatAmount(tx.amount) }}</td>
                <td class="px-3 py-2">{{ tx.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="py-4 text-center text-sm text-[var(--color-muted)]">
          {{ t('admin.userDetail.noTransactions') }}
        </p>
      </AppCard>

      <!-- Section KYC (Validation par l'Admin) -->
      <AppCard class="p-4">
        <template #title>
          <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
            <Shield class="h-4 w-4 text-[var(--color-accent)]" />
            Vérification KYC
          </span>
        </template>
        
        <div class="space-y-4 text-sm text-[var(--color-text)]">
          <!-- Statut Actuel -->
          <div class="flex items-center gap-2">
            <span class="font-medium">Statut :</span>
            <span
              class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="{
                'bg-kyc-verified/15 text-kyc-verified': user.profile?.kyc_status === 'verified',
                'bg-kyc-rejected/15 text-kyc-rejected': user.profile?.kyc_status === 'rejected',
                'bg-kyc-pending/15 text-kyc-pending': !user.profile || user.profile.kyc_status === 'pending'
              }"
            >
              {{ user.profile?.kyc_status ? String(user.profile.kyc_status).toUpperCase() : 'PENDING' }}
            </span>
          </div>

          <!-- Document -->
          <div>
            <span class="font-medium block mb-1">Pièce d'identité :</span>
            <div v-if="user.id_card_url" class="mt-2 rounded-lg border border-gray-200 p-2 max-w-sm">
              <a :href="user.id_card_url" target="_blank" rel="noopener noreferrer" class="block aspect-[1.6/1] bg-gray-100 overflow-hidden relative group">
                <img v-if="user.id_card_url.match(/\.(jpg|jpeg|png|webp|gif)$/i)" :src="user.id_card_url" class="object-cover w-full h-full" alt="Pièce d'identité" />
                <div v-else class="w-full h-full flex flex-col items-center justify-center text-[var(--color-muted)]">
                  📄 Voir le PDF
                </div>
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-medium">
                  Ouvrir
                </div>
              </a>
            </div>
            <p v-else class="text-[var(--color-muted)] italic">Aucun document téléchargé</p>
          </div>

          <!-- Dates KYC -->
          <div v-if="user.profile?.kyc_reviewed_at">
            <span class="font-medium">Vérifié le :</span>
            <span class="text-[var(--color-muted)] ml-2">{{ formatDate(user.profile.kyc_reviewed_at) }}</span>
          </div>

          <!-- Affichage Raison si rejeté -->
          <div v-if="user.profile?.kyc_status === 'rejected' && user.profile.kyc_rejection_reason" class="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 mt-2">
            <span class="font-medium">Raison du rejet :</span>
            <p class="mt-1">{{ user.profile.kyc_rejection_reason }}</p>
          </div>

          <!-- Espace d'Actions (Approuver/Rejeter) si document dispo -->
          <div v-if="user.id_card_url && user.profile?.kyc_status !== 'verified'" class="pt-4 border-t border-gray-100 mt-4">
            <p class="font-medium mb-2">Prendre une décision</p>
            <div class="flex flex-col gap-3 max-w-sm">
              <!-- Raison du rejet (visible si pending ou rejected) -->
              <textarea
                v-model="rejectionReason"
                class="w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="Raison du rejet (obligatoire en cas de refus)"
                rows="2"
              ></textarea>
              <div class="flex gap-2">
                <AppButton
                  type="button"
                  size="sm"
                  class="bg-kyc-verified hover:bg-emerald-600 text-white flex-1"
                  :loading="kycReviewing"
                  @click="handleKycReview('approve')"
                >
                  Approuver
                </AppButton>
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  class="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 flex-1"
                  :loading="kycReviewing"
                  @click="handleKycReview('reject')"
                >
                  Rejeter
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Connexion / Sécurité -->
      <AppCard class="p-4">
        <template #title>
          <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
            <Shield class="h-4 w-4 text-[var(--color-accent)]" />
            {{ t('admin.userDetail.securityTitle') }}
          </span>
        </template>
        
        <div class="space-y-4 text-sm text-[var(--color-text)] mt-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="font-medium mb-1">Statut actuel du compte :</p>
              <p class="text-sm font-semibold" :class="{
                'text-green-600': user.status === 'active',
                'text-yellow-600': user.status === 'restricted',
                'text-red-600': user.status === 'banned'
               }">
                {{ statusLabel(user.status) }}
              </p>
            </div>
            
            <div class="flex flex-wrap gap-2">
              <AppButton v-if="user.status !== 'active'" size="sm" variant="outline" @click="openStatusModal('active')">
                Réactiver
              </AppButton>
              <AppButton v-if="user.status !== 'restricted'" size="sm" variant="outline" class="text-amber-600 border-amber-200 hover:bg-amber-50" @click="openStatusModal('restricted')">
                Restreindre
              </AppButton>
              <AppButton v-if="user.status !== 'banned'" size="sm" variant="outline" class="text-red-600 border-red-200 hover:bg-red-50" @click="openStatusModal('banned')">
                Bannir définitivement
              </AppButton>
            </div>
          </div>

          <!-- Rôle RBAC -->
          <div class="pt-4 border-t border-gray-100 mt-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p class="font-medium mb-1">Rôle RBAC (Permissions fines) :</p>
                <div class="flex items-center gap-2">
                  <span v-if="user.rbac_role" class="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-xs font-bold">
                    {{ user.rbac_role.name }}
                  </span>
                  <span v-else class="text-gray-400 italic text-xs">Aucun rôle spécifique</span>
                </div>
              </div>
              <AppButton size="sm" variant="outline" @click="openRoleModal">
                Modifier le rôle
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>
    </template>
  </div>

  <!-- Modal Changement Statut -->
  <div v-if="showStatusModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
      <h3 class="mb-4 text-lg font-bold text-[var(--color-text)]">Modifier le statut</h3>
      <p class="mb-4 text-sm text-[var(--color-text)]">
        Nouveau statut : <strong>{{ statusLabel(targetStatus) }}</strong>
      </p>
      <textarea
        v-model="statusReason"
        class="w-full rounded-lg border border-gray-200 p-3 text-sm text-[var(--color-text)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        placeholder="Motif de la décision (obligatoire, loggué pour audit)"
        rows="3"
      ></textarea>
      <div class="mt-5 flex justify-end gap-3">
        <AppButton type="button" variant="ghost" @click="showStatusModal = false">Annuler</AppButton>
        <AppButton type="button" :loading="statusChanging" :disabled="!statusReason.trim()" @click="confirmStatusChange">Valider</AppButton>
      </div>
    </div>
  </div>

  <!-- Modal Changement Rôle RBAC -->
  <div v-if="showRoleModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800 border dark:border-gray-700">
      <h3 class="mb-4 text-lg font-bold text-[var(--color-text)]">Assigner un rôle RBAC</h3>
      
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-[var(--color-muted)] uppercase">Choisir le rôle</label>
          <select 
            v-model="selectedRoleId"
            class="w-full rounded-lg border border-gray-200 p-2.5 text-sm bg-transparent dark:border-gray-700"
          >
            <option :value="null">-- Aucun (Standard) --</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }} {{ role.is_system ? '(Système)' : '' }}
            </option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-[var(--color-muted)] uppercase">Motif de l'assignation</label>
          <textarea
            v-model="roleReason"
            class="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-[var(--color-text)] bg-transparent focus:ring-2 focus:ring-[var(--color-accent)] dark:border-gray-700"
            placeholder="Ex: Promotion, Changement d'équipe..."
            rows="2"
          ></textarea>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <AppButton type="button" variant="ghost" @click="showRoleModal = false">Annuler</AppButton>
        <AppButton type="button" :loading="roleChanging" :disabled="!roleReason.trim()" @click="confirmRoleChange">Enregistrer</AppButton>
      </div>
    </div>
  </div>
</template>
