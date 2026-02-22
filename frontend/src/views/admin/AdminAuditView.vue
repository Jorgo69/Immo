<script setup lang="ts">
/**
 * Vue Audit (admin root) : liste de toutes les transactions en lecture seule.
 * Aucune action de modification.
 */
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAuditTransactions } from '../../services/wallet.service'
import type { WalletTransactionDto } from '../../services/wallet.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppCard, AppParagraph, AppButton } from '../../components/ui'

const { t } = useI18n()
const loading = ref(true)
const error = ref('')
const data = ref<{ data: WalletTransactionDto[]; total: number; page: number; limit: number; totalPages: number }>({
  data: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
})

const transactions = computed(() => data.value.data)
const total = computed(() => data.value.total)
const page = computed(() => data.value.page)
const totalPages = computed(() => data.value.totalPages)
const hasPrev = computed(() => page.value > 1)
const hasNext = computed(() => page.value < totalPages.value)

function formatAmount(amount: string) {
  return new Intl.NumberFormat('fr-FR').format(Number(amount)) + ' FCFA'
}

function formatDate(createdAt: string) {
  if (!createdAt) return '—'
  return new Date(createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function load(p = page.value) {
  loading.value = true
  error.value = ''
  try {
    const result = await getAuditTransactions(p, data.value.limit)
    data.value = result
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg
  } finally {
    loading.value = false
  }
}

function prev() {
  if (hasPrev.value) load(page.value - 1)
}

function next() {
  if (hasNext.value) load(page.value + 1)
}

onMounted(() => load())
</script>

<template>
  <div class="max-w-layout mx-auto">
    <AppTitle :level="2" class="mb-2">{{ t('admin.audit.title') }}</AppTitle>
    <AppParagraph muted class="mb-6">
      {{ t('admin.audit.subtitle') }}
    </AppParagraph>

    <AppCard v-if="error" class="mb-4 p-4 text-red-600">
      {{ error }}
    </AppCard>

    <AppCard v-if="loading" class="p-8 text-center text-[var(--color-muted)]">
      {{ t('admin.loading') }}
    </AppCard>

    <template v-else>
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="w-full min-w-[600px] text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.audit.date') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.audit.userId') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.audit.type') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.audit.amount') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.audit.status') }}</th>
              <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('admin.audit.reference') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="tx in transactions"
              :key="tx.id"
              class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="px-4 py-3 text-[var(--color-text)]">{{ formatDate(tx.created_at) }}</td>
              <td class="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">
                {{ tx.wallet?.user_id ?? '—' }}
              </td>
              <td class="px-4 py-3 text-[var(--color-text)]">{{ tx.type }}</td>
              <td class="px-4 py-3 font-medium text-[var(--color-text)]">{{ formatAmount(tx.amount) }}</td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    tx.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : tx.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                  ]"
                >
                  {{ tx.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-[var(--color-muted)] text-xs">{{ tx.gateway_ref ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total === 0" class="py-12 text-center text-[var(--color-muted)]">
        {{ t('admin.audit.noTransactions') }}
      </div>

      <div
        v-else
        class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <span class="text-sm text-[var(--color-muted)]">
          {{ t('admin.audit.total') }} : {{ total }}
        </span>
        <div class="flex gap-2">
          <AppButton variant="outline" size="sm" :disabled="!hasPrev" @click="prev">
            {{ t('common.prev') }}
          </AppButton>
          <span class="flex items-center px-2 text-sm text-[var(--color-text)]">
            {{ page }} / {{ totalPages || 1 }}
          </span>
          <AppButton variant="outline" size="sm" :disabled="!hasNext" @click="next">
            {{ t('common.next') }}
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
