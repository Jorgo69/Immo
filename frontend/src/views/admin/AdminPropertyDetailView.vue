<script setup lang="ts">
/**
 * Page dédiée détail d'un bien (admin) : fil d'Ariane, infos, adresse, médias, chambres.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Building2, ArrowLeft, MapPin, Image, DoorOpen } from 'lucide-vue-next'
import { getUploadUrl } from '../../config/api'
import { getPropertyById, type PropertyDetailDto, type UnitDto } from '../../services/property.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppButton, AppCard } from '../../components/ui'
import AppLink from '../../components/ui/AppLink.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)
const property = ref<PropertyDetailDto | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const rooms = computed<UnitDto[]>(() => property.value?.units ?? property.value?.rooms ?? [])

function statusLabel(status: string): string {
  return t('admin.status.' + status)
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(Number(price)) + ' FCFA'
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function roomTypeLabel(type: string | null): string {
  if (!type) return '—'
  return t(`admin.roomType.${type}` as 'admin.roomType.chambre')
}

async function fetchDetail() {
  if (!id.value) return
  loading.value = true
  error.value = null
  try {
    property.value = await getPropertyById(id.value)
  } catch (e: unknown) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg || t('admin.propertyDetail.errorLoad')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'admin-properties' })
}

onMounted(() => fetchDetail())
watch(id, () => fetchDetail())
</script>

<template>
  <div class="space-y-6">
    <!-- Fil d'Ariane + Retour -->
    <div class="flex flex-wrap items-center gap-3">
      <AppButton variant="ghost" size="sm" :aria-label="t('admin.propertyDetail.back')" @click="goBack">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <nav class="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <AppLink :to="{ name: 'admin-properties' }" class="hover:text-[var(--color-accent)]">
          {{ t('admin.properties.title') }}
        </AppLink>
        <span aria-hidden="true">/</span>
        <span class="font-medium text-[var(--color-text)]">{{ t('admin.propertyDetail.breadcrumb') }}</span>
      </nav>
    </div>

    <AppTitle :level="2">{{ property?.name ?? property?.title ?? t('admin.properties.title') }}</AppTitle>

    <div v-if="loading" class="py-12 text-center text-[var(--color-muted)] text-sm">
      {{ t('admin.properties.loading') }}
    </div>
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
      <AppButton variant="ghost" size="sm" class="mt-2" @click="fetchDetail">
        {{ t('admin.propertyDetail.retry') }}
      </AppButton>
    </div>
    <template v-else-if="property">
      <!-- Carte bien -->
      <AppCard class="p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[var(--color-muted)]"
          >
            <Building2 class="h-8 w-8" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-lg font-semibold text-[var(--color-text)]">{{ property.name ?? property.title }}</h3>
            <p class="mt-1 text-sm text-[var(--color-muted)]">{{ typeof property.city === 'string' ? property.city : property.city?.name }}{{ property.district ? ` · ${property.district}` : '' }}</p>
            <span
              class="mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800': property.status === 'available',
                'bg-amber-100 text-amber-800': property.status === 'coming_soon',
                'bg-gray-100 text-gray-700': property.status === 'occupied',
                'bg-orange-100 text-orange-800': property.status === 'maintenance',
              }"
            >
              {{ statusLabel(property.status) }}
            </span>
          </div>
        </div>
      </AppCard>

      <!-- Informations -->
      <AppCard>
        <template #title>
          <span class="text-sm font-medium text-[var(--color-text)]">{{ t('admin.propertyDetail.info') }}</span>
        </template>
        <dl class="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="font-medium text-[var(--color-muted)]">{{ t('admin.propertyDetail.price') }}</dt>
            <dd class="mt-0.5 text-[var(--color-text)]">{{ formatPrice(property.price_monthly ?? property.units?.[0]?.price ?? '0') }} {{ t('admin.propertyDetail.perMonth') }}</dd>
          </div>
          <div>
            <dt class="font-medium text-[var(--color-muted)]">{{ t('admin.propertyDetail.status') }}</dt>
            <dd class="mt-0.5">{{ statusLabel(property.status) }}</dd>
          </div>
          <div v-if="property.owner_id" class="sm:col-span-2">
            <dt class="font-medium text-[var(--color-muted)]">{{ t('admin.propertyDetail.owner') }}</dt>
            <dd class="mt-0.5 font-mono text-xs text-[var(--color-text)]">{{ property.owner_id }}</dd>
          </div>
          <div v-if="property.agent_id">
            <dt class="font-medium text-[var(--color-muted)]">{{ t('admin.propertyDetail.agent') }}</dt>
            <dd class="mt-0.5 font-mono text-xs text-[var(--color-text)]">{{ property.agent_id }}</dd>
          </div>
          <div>
            <dt class="font-medium text-[var(--color-muted)]">{{ t('admin.propertyDetail.createdAt') }}</dt>
            <dd class="mt-0.5 text-[var(--color-text)]">{{ formatDate(property.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-[var(--color-muted)]">{{ t('admin.propertyDetail.updatedAt') }}</dt>
            <dd class="mt-0.5 text-[var(--color-text)]">{{ formatDate(property.updated_at) }}</dd>
          </div>
        </dl>
      </AppCard>

      <!-- Adresse -->
      <AppCard v-if="property.address || property.address_details || property.district">
        <template #title>
          <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
            <MapPin class="h-4 w-4 text-[var(--color-accent)]" />
            {{ t('admin.propertyDetail.address') }}
          </span>
        </template>
        <p class="text-sm text-[var(--color-text)]">
          {{ property.address || property.address_details || property.district || (typeof property.city === 'string' ? property.city : property.city?.name) }}
        </p>
      </AppCard>

      <!-- Médias -->
      <AppCard>
        <template #title>
          <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
            <Image class="h-4 w-4 text-[var(--color-accent)]" />
            {{ t('admin.propertyDetail.media') }}
          </span>
        </template>
        <div v-if="property.media?.length" class="flex flex-wrap gap-2">
          <a
            v-for="m in property.media"
            :key="m.id"
            :href="getUploadUrl(m.url)"
            target="_blank"
            rel="noopener noreferrer"
            class="block overflow-hidden rounded-lg border border-gray-200"
          >
            <img :src="getUploadUrl(m.url)" :alt="m.type" class="h-24 w-32 object-cover" />
          </a>
        </div>
        <p v-else class="text-sm text-[var(--color-muted)]">{{ t('admin.propertyDetail.noMedia') }}</p>
      </AppCard>

      <!-- Chambres -->
      <AppCard>
        <template #title>
          <span class="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
            <DoorOpen class="h-4 w-4 text-[var(--color-accent)]" />
            {{ t('admin.propertyDetail.rooms') }} ({{ rooms.length }})
          </span>
        </template>
        <div v-if="rooms.length" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-[var(--color-muted)]">
              <tr>
                <th class="px-3 py-2 font-medium">{{ t('admin.propertyDetail.roomName') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.propertyDetail.roomType') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.propertyDetail.roomPrice') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.propertyDetail.roomSurface') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.propertyDetail.roomFloor') }}</th>
                <th class="px-3 py-2 font-medium">{{ t('admin.propertyDetail.roomAvailable') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="r in rooms" :key="r.id" class="text-[var(--color-text)]">
                <td class="px-3 py-2 font-medium">{{ r.name }}</td>
                <td class="px-3 py-2">{{ roomTypeLabel(r.type) }}</td>
                <td class="px-3 py-2">{{ (r.price ?? r.price_monthly) ? formatPrice(r.price ?? r.price_monthly ?? '0') : '—' }}</td>
                <td class="px-3 py-2">{{ r.surface_m2 != null ? r.surface_m2 + ' m²' : '—' }}</td>
                <td class="px-3 py-2">{{ r.floor != null ? r.floor : '—' }}</td>
                <td class="px-3 py-2">
                  <span :class="r.is_available ? 'text-green-600' : 'text-gray-500'">
                    {{ r.is_available ? 'Oui' : 'Non' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="py-4 text-center text-sm text-[var(--color-muted)]">{{ t('admin.propertyDetail.noRooms') }}</p>
      </AppCard>
    </template>
  </div>
</template>
