<script setup lang="ts">
/**
 * Suivi des demandes de location du locataire — En attente, Accepté, Refusé.
 */
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileText, Home, Clock, CheckCircle, XCircle } from 'lucide-vue-next'
import { getRentalRequestsForTenant, type RentalRequestDto } from '../../services/rental.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppCard, AppTitle, AppContent } from '../../components/ui'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const loading = ref(true)
const requests = ref<RentalRequestDto[]>([])

async function fetchRequests() {
  loading.value = true
  try {
    requests.value = await getRentalRequestsForTenant()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
    requests.value = []
  } finally {
    loading.value = false
  }
}

function unitDisplay(r: RentalRequestDto): string {
  const unit = r.unit
  if (!unit) return '—'
  return unit.name ?? unit.id
}

function statusLabel(status: string): string {
  if (status === 'pending') return t('rental.statusPending')
  if (status === 'accepted') return t('rental.statusAccepted')
  return t('rental.statusRejected')
}

function statusIcon(status: string) {
  if (status === 'pending') return Clock
  if (status === 'accepted') return CheckCircle
  return XCircle
}

function goToProperty(r: RentalRequestDto) {
  const unit = r.unit
  if (!unit) return
  const propertyId = unit.property_id ?? unit.id
  router.push({ name: 'property-detail', params: { id: propertyId } })
}

onMounted(fetchRequests)
</script>

<template>
  <AppContent variant="standard">
  <div class="space-y-6">
    <div>
      <AppTitle :level="2" class="flex items-center gap-2">
        <FileText class="w-7 h-7 text-[var(--color-accent)]" />
        {{ t('rental.myRequestsTitle') }}
      </AppTitle>
      <p class="mt-1 text-sm text-[var(--color-muted)]">
        {{ t('rental.myRequestsSubtitle') }}
      </p>
    </div>

    <div v-if="loading" class="py-12 text-center text-[var(--color-muted)] text-sm">
      {{ t('admin.properties.loading') }}
    </div>

    <div v-else-if="!requests.length" class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-[var(--color-muted)]">
      {{ t('rental.noRequests') }}
      <AppButton variant="primary" size="sm" class="mt-4" @click="router.push({ name: 'property-list' })">
        {{ t('property.listTitle') }}
      </AppButton>
    </div>

    <div v-else class="space-y-4">
      <AppCard
        v-for="r in requests"
        :key="r.id"
        class="p-4"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <component
                :is="statusIcon(r.status)"
                class="w-4 h-4 shrink-0"
                :class="{
                  'text-amber-600 dark:text-amber-400': r.status === 'pending',
                  'text-green-600 dark:text-green-400': r.status === 'accepted',
                  'text-gray-500 dark:text-gray-400': r.status === 'rejected',
                }"
              />
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="{
                  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300': r.status === 'pending',
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': r.status === 'accepted',
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': r.status === 'rejected',
                }"
              >
                {{ statusLabel(r.status) }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <Home class="w-4 h-4 text-[var(--color-muted)] shrink-0" />
              <span>{{ unitDisplay(r) }}</span>
            </div>
            <p v-if="r.desired_move_in_at" class="text-xs text-[var(--color-muted)]">
              {{ t('rental.desiredMoveInLabel') }} : {{ r.desired_move_in_at }}
            </p>
          </div>
          <AppButton
            variant="ghost"
            size="sm"
            @click="goToProperty(r)"
          >
            {{ t('property.detail') }}
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
  </AppContent>
</template>
