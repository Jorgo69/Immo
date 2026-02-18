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
  type AdminUserDto,
  type UserRole,
  type UserDetailResultDto,
  type PaginatedTransactionsResult,
} from '../../services/user.service'
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

const user = computed<AdminUserDto | null>(() => detail.value?.user ?? null)
const stats = computed(() => detail.value?.stats ?? null)

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
    error.value = e instanceof Error ? e.message : t('admin.userDetail.errorLoad')
  } finally {
    loading.value = false
    transactionsLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'admin-users' })
}

onMounted(() => fetchDetail())
watch(id, () => fetchDetail())
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
          :class="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
        >
          {{ statusLabel(user.is_active) }}
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

      <!-- Connexion / Sécurité (placeholder) -->
      <AppCard class="p-4">
        <template #title>
          <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
            <Shield class="h-4 w-4 text-[var(--color-accent)]" />
            {{ t('admin.userDetail.securityTitle') }}
          </span>
        </template>
        <p class="text-sm text-[var(--color-muted)]">
          {{ t('admin.userDetail.securityPlaceholder') }}
        </p>
      </AppCard>
    </template>
  </div>
</template>
