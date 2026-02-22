<script setup lang="ts">
/**
 * Liste des demandes de location reçues par le propriétaire — Qui veut louer quoi ?
 * Boutons Accepter / Refuser. Accept → unit OCCUPIED, autres demandes pour l'unité refusées.
 */
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileText, User, Home, Check, X } from 'lucide-vue-next'
import { getRentalRequestsForLandlord, acceptRentalRequest, rejectRentalRequest, type RentalRequestDto } from '../../services/rental.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppCard, AppTitle } from '../../components/ui'

const { t } = useI18n()
const loading = ref(true)
const requests = ref<RentalRequestDto[]>([])
const actingId = ref<string | null>(null)

async function fetchRequests() {
  loading.value = true
  try {
    requests.value = await getRentalRequestsForLandlord()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
    requests.value = []
  } finally {
    loading.value = false
  }
}

function tenantDisplay(r: RentalRequestDto): string {
  const tenant = r.tenant
  if (!tenant) return t('rental.tenant')
  if (tenant.email) return tenant.email
  return tenant.id.slice(0, 8) + '…'
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

async function accept(r: RentalRequestDto) {
  if (r.status !== 'pending') return
  actingId.value = r.id
  try {
    await acceptRentalRequest(r.id)
    toast.success(t('rental.accepted'))
    await fetchRequests()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

async function reject(r: RentalRequestDto) {
  if (r.status !== 'pending') return
  actingId.value = r.id
  try {
    await rejectRentalRequest(r.id)
    toast.success(t('rental.rejected'))
    await fetchRequests()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

onMounted(fetchRequests)
</script>

<template>
  <div class="space-y-6">
    <div>
      <AppTitle :level="2" class="flex items-center gap-2">
        <FileText class="w-7 h-7 text-[var(--color-accent)]" />
        {{ t('rental.requestsTitle') }}
      </AppTitle>
      <p class="mt-1 text-sm text-[var(--color-muted)]">
        {{ t('rental.requestsSubtitle') }}
      </p>
    </div>

    <div v-if="loading" class="py-12 text-center text-[var(--color-muted)] text-sm">
      {{ t('admin.properties.loading') }}
    </div>

    <div v-else-if="!requests.length" class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-[var(--color-muted)]">
      {{ t('rental.noRequests') }}
    </div>

    <div v-else class="space-y-4">
      <AppCard
        v-for="r in requests"
        :key="r.id"
        class="p-4"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
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
              <User class="w-4 h-4 text-[var(--color-muted)] shrink-0" />
              <span>{{ tenantDisplay(r) }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <Home class="w-4 h-4 text-[var(--color-muted)] shrink-0" />
              <span>{{ t('rental.unitName') }} : <strong>{{ unitDisplay(r) }}</strong></span>
            </div>
            <p v-if="r.message" class="text-sm text-[var(--color-muted)] line-clamp-2">
              {{ r.message }}
            </p>
            <p v-if="r.desired_move_in_at" class="text-xs text-[var(--color-muted)]">
              {{ t('rental.desiredMoveInLabel') }} : {{ r.desired_move_in_at }}
            </p>
          </div>
          <div v-if="r.status === 'pending'" class="flex gap-2 shrink-0">
            <AppButton
              variant="primary"
              size="sm"
              :loading="actingId === r.id"
              :disabled="actingId != null"
              @click="accept(r)"
            >
              <Check class="w-4 h-4" />
              {{ t('rental.accept') }}
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              :loading="actingId === r.id"
              :disabled="actingId != null"
              @click="reject(r)"
            >
              <X class="w-4 h-4" />
              {{ t('rental.reject') }}
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
