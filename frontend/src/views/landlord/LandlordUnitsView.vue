<script setup lang="ts">
/**
 * Vue Unités : liste de toutes les unités (rattachées ou standalone) du propriétaire.
 * Gestion directe des chambres (lien vers le bien pour édition).
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Key, Building2 } from 'lucide-vue-next'
import { getMyProperties } from '../../services/property.service'
import type { PropertyListItemDto, UnitDto } from '../../services/property.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppCard, AppParagraph, AppButton } from '../../components/ui'

const { t } = useI18n()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const properties = ref<PropertyListItemDto[]>([])

interface UnitWithProperty {
  unit: UnitDto
  propertyName: string
  propertyId: string | null
}

const unitsFlat = computed<UnitWithProperty[]>(() => {
  const list: UnitWithProperty[] = []
  for (const p of properties.value) {
    const name = typeof p.name === 'string' ? p.name : (p.name as { fr?: string })?.fr ?? (p as PropertyListItemDto).title ?? p.id
    const units = p.units ?? []
    if (units.length === 0) continue
    for (const u of units) {
      list.push({ unit: u, propertyName: name, propertyId: p.id })
    }
  }
  return list
})

function formatPrice(price: string | number | undefined) {
  if (price == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(Number(price)) + ' FCFA'
}

function goToProperty(propertyId: string) {
  router.push(`/admin/landlord/properties`)
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getMyProperties({ limit: 100 })
    properties.value = res.data
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-layout mx-auto">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Key class="w-7 h-7 text-[var(--color-accent)]" />
        <div>
          <AppTitle :level="2">{{ t('admin.navUnits') }}</AppTitle>
          <AppParagraph muted small>
            {{ t('admin.proInventorySubtitle') }}
          </AppParagraph>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="router.push('/admin/landlord/properties')">
        <Building2 class="w-4 h-4" />
        {{ t('landlord.myProperties') }}
      </AppButton>
    </div>

    <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
    <AppCard v-if="loading" class="p-8 text-center text-[var(--color-muted)]">
      {{ t('admin.loading') }}
    </AppCard>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="w-full min-w-[500px] text-left text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('landlord.unitName') }}</th>
            <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('landlord.myProperties') }}</th>
            <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('landlord.unitPrice') }}</th>
            <th class="px-4 py-3 font-medium text-[var(--color-text)]">{{ t('landlord.unitStatus') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="item in unitsFlat"
            :key="item.unit.id"
            class="cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            @click="item.propertyId && goToProperty(item.propertyId)"
          >
            <td class="px-4 py-3 font-medium text-[var(--color-text)]">{{ item.unit.name }}</td>
            <td class="px-4 py-3 text-[var(--color-muted)]">{{ item.propertyName }}</td>
            <td class="px-4 py-3 text-[var(--color-text)]">{{ formatPrice(item.unit.price) }}</td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  item.unit.unit_status === 'available'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : item.unit.unit_status === 'occupied'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                ]"
              >
                {{ item.unit.unit_status ?? '—' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!loading && unitsFlat.length === 0" class="mt-6 text-center text-[var(--color-muted)]">
      {{ t('admin.dashboardNoProperties') }}
    </p>
  </div>
</template>
