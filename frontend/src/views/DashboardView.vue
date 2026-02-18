<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import { Wallet, Plus, ArrowDownLeft } from 'lucide-vue-next'
import { getMyWallet, getMyTransactions, recordSaving } from '../services/wallet.service'
import { AppTitle, AppCard, AppButton, AppInput, StatCard, AppPagination } from '../components/ui'

const { t } = useI18n()
const wallet = ref<{ balance_total: string; balance_savings: string } | null>(null)
const transactions = ref<
  Array<{ id: string; amount: string; type: string; status: string; created_at: string }>
>([])
const loading = ref(true)
const error = ref('')
const savingAmount = ref('')
const savingLoading = ref(false)

const targetRent = 100000
const TX_PAGE_SIZE = 10
const txPage = ref(1)
const txTotalPages = ref(0)
const txTotal = ref(0)

async function fetchWallet() {
  wallet.value = await getMyWallet()
}

async function fetchTransactions(page = 1) {
  txPage.value = page
  const result = await getMyTransactions(page, TX_PAGE_SIZE)
  transactions.value = result.data
  txTotal.value = result.total
  txTotalPages.value = result.totalPages
}

function onTxPageChange(page: number) {
  fetchTransactions(page)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([fetchWallet(), fetchTransactions()])
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    loading.value = false
  }
}

async function addSaving() {
  const amount = Number(savingAmount.value)
  if (!amount || amount <= 0) return
  savingLoading.value = true
  error.value = ''
  try {
    await recordSaving(amount)
    savingAmount.value = ''
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    savingLoading.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(value: string) {
  return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA'
}

function savingsProgress(): number {
  if (!wallet.value) return 0
  const current = Number(wallet.value.balance_savings || 0)
  if (!targetRent) return 0
  return Math.min(100, Math.round((current / targetRent) * 100))
}

function nextRentDate(): string | null {
  const lastRent = transactions.value.find((tx) => tx.type === 'rent')
  if (!lastRent) return null
  const d = new Date(lastRent.created_at)
  d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(load)
</script>

<template>
  <main class="max-w-layout mx-auto px-6 md:px-8 py-8">
    <AppTitle :level="2" class="mb-6 flex items-center gap-2">
      <Wallet class="w-6 h-6 text-[var(--color-accent)]" />
      {{ t('dashboard.title') }}
    </AppTitle>

    <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>
    <p v-if="loading" class="text-[var(--color-muted)]">{{ t('profile.loading') }}</p>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard :label="t('dashboard.balanceTotal')" :value="wallet ? formatAmount(wallet.balance_total) : '—'" />
        <div class="p-4 rounded-xl border border-gray-200 bg-white">
          <p class="text-sm text-[var(--color-muted)]">{{ t('dashboard.balanceSavings') }}</p>
          <p class="text-lg font-semibold text-[var(--color-accent)]">
            {{ wallet ? formatAmount(wallet.balance_savings) : '—' }}
          </p>
          <div class="mt-3">
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-[var(--color-accent)] transition-all"
                :style="{ width: savingsProgress() + '%' }"
              />
            </div>
            <p class="mt-1 text-[10px] text-[var(--color-muted)]">
              Objectif illustratif : {{ targetRent.toLocaleString('fr-FR') }} FCFA ({{ savingsProgress() }}%)
            </p>
          </div>
        </div>
        <AppCard padding="sm">
          <p class="text-[10px] text-[var(--color-muted)] mb-1 uppercase tracking-wide">
            Prochaine échéance estimée
          </p>
          <p class="text-lg font-semibold text-[var(--color-text)]">
            {{ nextRentDate() || '—' }}
          </p>
          <p class="mt-1 text-[10px] text-[var(--color-muted)]">
            Basée sur votre dernier paiement de loyer.
          </p>
        </AppCard>
      </div>

      <AppCard class="mb-8">
        <template #title>
          <h2 class="text-sm font-medium text-[var(--color-muted)] flex items-center gap-2">
            <Plus class="w-4 h-4" />
            {{ t('dashboard.addSaving') }}
          </h2>
        </template>
        <form class="flex gap-2 flex-wrap items-end" @submit.prevent="addSaving">
          <AppInput
            v-model="savingAmount"
            type="number"
            :min="1"
            step="100"
            :placeholder="t('dashboard.amount')"
            class="flex-1 min-w-[120px]"
          />
          <AppButton type="submit" :loading="savingLoading">
            {{ t('dashboard.submit') }}
          </AppButton>
        </form>
      </AppCard>

      <section>
        <h2 class="text-sm font-medium text-[var(--color-muted)] mb-3 flex items-center gap-2">
          <ArrowDownLeft class="w-4 h-4" />
          {{ t('dashboard.recentTransactions') }}
        </h2>
        <ul v-if="transactions.length" class="space-y-2">
          <li
            v-for="tx in transactions"
            :key="tx.id"
            class="flex justify-between items-center p-3 rounded-lg border border-gray-200 bg-white text-sm"
          >
            <span>{{ t('dashboard.type.' + tx.type) }} · {{ formatDate(tx.created_at) }}</span>
            <span class="font-medium">{{ formatAmount(tx.amount) }}</span>
          </li>
        </ul>
        <p v-else class="text-[var(--color-muted)] text-sm">{{ t('dashboard.noTransactions') }}</p>
        <AppPagination
          v-if="txTotal > 0"
          :page="txPage"
          :total-pages="txTotalPages"
          :total="txTotal"
          :limit="TX_PAGE_SIZE"
          @page-change="onTxPageChange"
        />
      </section>
    </template>
  </main>
</template>
