<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getActivityLogs } from '../../services/audit.service'
import type { ActivityLogDto } from '../../services/audit.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppCard, AppParagraph, AppButton } from '../../components/ui'
import { FileCode2, History } from 'lucide-vue-next'

const { t } = useI18n()
const loading = ref(true)
const error = ref('')
const data = ref<{ data: ActivityLogDto[]; total: number; page: number; limit: number; totalPages: number }>({
  data: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
})

const logs = computed(() => data.value.data)
const total = computed(() => data.value.total)
const page = computed(() => data.value.page)
const totalPages = computed(() => data.value.totalPages)
const hasPrev = computed(() => page.value > 1)
const hasNext = computed(() => page.value < totalPages.value)

const selectedLog = ref<ActivityLogDto | null>(null)

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

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    case 'BAN':
    case 'RESTRICT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

async function load(p = page.value) {
  loading.value = true
  error.value = ''
  try {
    const result = await getActivityLogs(p, data.value.limit)
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

function viewDetails(log: ActivityLogDto) {
  selectedLog.value = log
}

onMounted(() => load())
</script>

<template>
  <div class="max-w-layout mx-auto">
    <div class="mb-6 flex items-center gap-3">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
        <History class="h-6 w-6" />
      </div>
      <div>
        <AppTitle :level="2" class="mb-1">Trace d'Audit</AppTitle>
        <AppParagraph muted class="text-sm">
          Historique technique et métier de toutes les actions sur la plateforme.
        </AppParagraph>
      </div>
    </div>

    <AppCard v-if="error" class="mb-4 p-4 text-red-600">
      {{ error }}
    </AppCard>

    <AppCard v-if="loading" class="p-8 text-center text-[var(--color-muted)]">
      Chargement de l'historique...
    </AppCard>

    <template v-else>
      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <table class="w-full min-w-[800px] text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/80">
            <tr>
              <th class="px-5 py-4 font-semibold text-[var(--color-text)]">Date</th>
              <th class="px-5 py-4 font-semibold text-[var(--color-text)]">Action</th>
              <th class="px-5 py-4 font-semibold text-[var(--color-text)]">Module (Entité)</th>
              <th class="px-5 py-4 font-semibold text-[var(--color-text)]">Utilisateur</th>
              <th class="px-5 py-4 font-semibold text-[var(--color-text)]">Détails</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="log in logs"
              :key="log.id"
              class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-5 py-4 text-[var(--color-text)] whitespace-nowrap">{{ formatDate(log.created_at) }}</td>
              <td class="px-5 py-4">
                <span :class="['rounded-full px-2.5 py-1 text-xs font-bold tracking-wider', getActionColor(log.action)]">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="font-medium text-[var(--color-text)]">{{ log.entity_type || 'Système' }}</div>
                <div class="text-[11px] font-mono mt-0.5 text-[var(--color-muted)]" :title="log.entity_id">
                  {{ log.entity_id ? log.entity_id.split('-')[0] + '...' : '—' }}
                </div>
              </td>
              <td class="px-5 py-4 font-mono text-[11px] text-[var(--color-muted)]">
                <div :title="log.user_id">{{ log.user_id ? log.user_id.split('-')[0] + '...' : 'Système/Cron' }}</div>
                <div class="mt-0.5 opacity-70">{{ log.ip_address || '—' }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[var(--color-muted)] truncate max-w-[200px]" :title="log.description">
                    {{ log.description }}
                  </span>
                  <button
                    v-if="log.new_values || log.old_values"
                    @click="viewDetails(log)"
                    class="ml-2 text-[var(--color-accent)] hover:text-black dark:hover:text-white transition-colors p-1"
                    title="Voir les données JSON"
                  >
                    <FileCode2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total === 0" class="py-12 text-center text-[var(--color-muted)]">
        Aucune activité enregistrée pour le moment.
      </div>

      <div
        v-else
        class="mt-6 flex flex-wrap items-center justify-between gap-4"
      >
        <span class="text-sm font-medium text-[var(--color-muted)]">
          Total logs : <span class="text-[var(--color-text)]">{{ total }}</span>
        </span>
        <div class="flex items-center gap-3">
          <AppButton variant="outline" size="sm" :disabled="!hasPrev" @click="prev" class="rounded-lg">
            {{ t('common.prev') }}
          </AppButton>
          <span class="px-2 text-sm font-medium text-[var(--color-text)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-1.5 min-w-[4rem] text-center">
            {{ page }} / {{ totalPages || 1 }}
          </span>
          <AppButton variant="outline" size="sm" :disabled="!hasNext" @click="next" class="rounded-lg">
            {{ t('common.next') }}
          </AppButton>
        </div>
      </div>
    </template>

    <!-- Modal Détails JSON -->
    <div v-if="selectedLog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" @click.self="selectedLog = null">
      <div class="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800">
        <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-lg font-bold">Détails de modification</h3>
          <button @click="selectedLog = null" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--color-muted)]">✕</button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 font-mono text-xs">
          <div v-if="selectedLog.old_values" class="mb-4">
            <h4 class="text-[var(--color-muted)] mb-2 font-sans font-semibold text-sm">Anciennes valeurs :</h4>
            <pre class="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl overflow-x-auto text-[var(--color-text)] border border-gray-100 dark:border-gray-800">{{ JSON.stringify(selectedLog.old_values, null, 2) }}</pre>
          </div>
          <div v-if="selectedLog.new_values">
            <h4 class="text-[var(--color-muted)] mb-2 font-sans font-semibold text-sm">Nouvelles valeurs :</h4>
            <pre class="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl overflow-x-auto text-[var(--color-text)] border border-emerald-100 dark:border-emerald-900/30">{{ JSON.stringify(selectedLog.new_values, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
