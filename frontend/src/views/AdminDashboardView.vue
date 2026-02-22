<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useNotificationsStore } from '../stores/notifications'
import {
  searchProperties,
  getPropertyById,
  createProperty,
  createUnit,
  type PropertyDetailDto,
  type PropertyListItemDto,
} from '../services/property.service'
import { getRefTypes } from '../services/references.service'
import { getCountries, getCities } from '../services/location.service'
import { getApiErrorMessage } from '../services/http'
import { toast } from 'vue-sonner'
import { LayoutDashboard, MapPin, Building2, ShieldCheck, Plus } from 'lucide-vue-next'
import { AppButton, AppCard, AppTitle, AppParagraph, AppInput, StatCard } from '../components/ui'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()
const notifications = useNotificationsStore()

const loading = ref(true)
const error = ref('')
const allProperties = ref<PropertyListItemDto[]>([])
const propertyDetails = ref<Record<string, PropertyDetailDto>>({})

const showAddForm = ref(false)
const formStep = ref<1 | 2>(1)
const creating = ref(false)
const formError = ref('')

const PROPERTY_STATUSES = ['available', 'coming_soon', 'occupied', 'maintenance'] as const
const ROOM_TYPES = ['chambre', 'studio', 'appartement', 'autre'] as const

const form = ref({
  title: '',
  city: '',
  district: '',
  address_details: '',
  price_monthly: '' as string | number,
  latitude: '' as string | number,
  longitude: '' as string | number,
  status: 'available' as (typeof PROPERTY_STATUSES)[number],
})
const rooms = ref<Array<{ name: string; type: string; price_monthly: string | number; surface_m2: string | number; floor: string | number }>>([])
const defaultCityId = ref<string | null>(null)

const userId = computed(() => appStore.userId)
const role = computed(() => appStore.userRole)

const ownedProperties = computed(() =>
  allProperties.value.filter((p) => p.owner_id === userId.value),
)
const managedProperties = computed(() =>
  allProperties.value.filter((p) => p.agent_id === userId.value),
)
const ownedDetails = computed(() =>
  ownedProperties.value
    .map((p) => propertyDetails.value[p.id])
    .filter((d): d is PropertyDetailDto => !!d),
)
const managedDetails = computed(() =>
  managedProperties.value
    .map((p) => propertyDetails.value[p.id])
    .filter((d): d is PropertyDetailDto => !!d),
)
const totalRoomsOwned = computed(() =>
  ownedDetails.value.reduce((acc, d) => acc + (d.units?.length ?? d.rooms?.length ?? 0), 0),
)
const totalManagedRooms = computed(() =>
  managedDetails.value.reduce((acc, d) => acc + (d.units?.length ?? d.rooms?.length ?? 0), 0),
)
const totalRooms = computed(() => totalRoomsOwned.value + totalManagedRooms.value)

async function load() {
  if (!userId.value) return
  loading.value = true
  error.value = ''
  try {
    const searchResult = await searchProperties({ limit: 100 })
    allProperties.value = searchResult.data
    const ids = Array.from(
      new Set(
        allProperties.value
          .filter((p) => p.owner_id === userId.value || p.agent_id === userId.value)
          .map((p) => p.id),
      ),
    )
    const details = await Promise.all(ids.map((id) => getPropertyById(id)))
    propertyDetails.value = details.reduce<Record<string, PropertyDetailDto>>((acc, d) => {
      acc[d.id] = d
      return acc
    }, {})
    if (!defaultCityId.value) {
      const countries = await getCountries()
      if (countries.length) {
        const cities = await getCities(countries[0].id)
        if (cities.length) defaultCityId.value = cities[0].id
      }
    }
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg
  } finally {
    loading.value = false
  }
}

function formatPrice(value: string) {
  return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA'
}

function openAddForm() {
  showAddForm.value = true
  formStep.value = 1
  formError.value = ''
  form.value = {
    title: 'Sans nom',
    city: '',
    district: '',
    address_details: '',
    price_monthly: '',
    latitude: '',
    longitude: '',
    status: 'available',
  }
  rooms.value = []
}

function addRoomRow() {
  rooms.value.push({
    name: '',
    type: 'chambre',
    price_monthly: '',
    surface_m2: '',
    floor: '0',
  })
}

function removeRoomRow(index: number) {
  rooms.value.splice(index, 1)
}

function validateStep1(): boolean {
  formError.value = ''
  if (!form.value.title?.trim() || !form.value.city?.trim()) {
    formError.value = t('admin.validation.titleRequired')
    return false
  }
  const price = Number(form.value.price_monthly)
  if (form.value.price_monthly === '' || isNaN(price) || price < 0) {
    formError.value = t('admin.validation.priceInvalid')
    return false
  }
  return true
}

function goToStep2() {
  if (validateStep1()) {
    formError.value = ''
    formStep.value = 2
    if (rooms.value.length === 0) addRoomRow()
  }
}

function goToStep1() {
  formStep.value = 1
  formError.value = ''
}

async function submitCreate() {
  if (!userId.value) return
  if (formStep.value === 1) {
    goToStep2()
    return
  }
  if (!validateStep1() || !defaultCityId.value) return
  creating.value = true
  formError.value = ''
  try {
    const lat = form.value.latitude !== '' ? Number(form.value.latitude) : undefined
    const lng = form.value.longitude !== '' ? Number(form.value.longitude) : undefined
    const created = await createProperty({
      name: form.value.title.trim(),
      building_type: 'villa',
      address: form.value.address_details?.trim() || form.value.city.trim() || '',
      city_id: defaultCityId.value,
      ...(typeof lat === 'number' && !Number.isNaN(lat) && { gps_latitude: lat }),
      ...(typeof lng === 'number' && !Number.isNaN(lng) && { gps_longitude: lng }),
      status: form.value.status,
    })
    const refTypesList = await getRefTypes()
    for (const r of rooms.value) {
      if (!r.name?.trim()) continue
      const priceVal = r.price_monthly !== '' ? Number(r.price_monthly) : 0
      const surfaceVal = r.surface_m2 !== '' ? Number(r.surface_m2) : undefined
      const floorVal = r.floor !== '' ? Number(r.floor) : undefined
      const code = r.type === 'chambre' ? 'chambre_salon' : r.type === 'appartement' ? '2_chambres_salon' : r.type || 'studio'
      const refType = refTypesList.find((t) => t.code === code) ?? refTypesList[0]
      if (!refType) continue
      await createUnit(created.id, {
        name: r.name.trim(),
        ref_type_id: refType.id,
        price: typeof priceVal === 'number' && !Number.isNaN(priceVal) ? priceVal : 0,
        ...(typeof surfaceVal === 'number' && surfaceVal >= 0 && { surface_m2: surfaceVal }),
        ...(typeof floorVal === 'number' && floorVal >= 0 && { floor: floorVal }),
      })
    }
    notifications.add({
      type: 'success',
      title: t('admin.created'),
      actionUrl: `/property/${created.id}`,
    })
    showAddForm.value = false
    formStep.value = 1
    await load()
  } catch (e) {
    formError.value = getApiErrorMessage(e)
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="max-w-layout mx-auto px-6 md:px-8 py-8">
    <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <LayoutDashboard class="w-7 h-7 text-[var(--color-accent)]" />
        <div>
          <AppTitle :level="2">{{ t('admin.title') }}</AppTitle>
          <AppParagraph muted small>{{ t('admin.subtitle', { role: role || '—' }) }}</AppParagraph>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <ShieldCheck class="w-4 h-4 text-[var(--color-accent)]" />
          <span>{{ t('admin.hint') }}</span>
        </div>
        <template v-if="role === 'landlord'">
          <AppButton variant="outline" size="sm" @click="router.push('/admin/landlord/properties')">
            <Building2 class="w-4 h-4" />
            {{ t('landlord.myProperties') }}
          </AppButton>
          <AppButton variant="primary" size="sm" @click="router.push('/admin/landlord/properties?openAdd=property')">
            <Plus class="w-4 h-4" />
            {{ t('landlord.addProperty') }}
          </AppButton>
        </template>
        <AppButton v-else-if="!showAddForm" variant="primary" size="sm" @click="openAddForm">
          <Plus class="w-4 h-4" />
          {{ t('admin.addProperty') }}
        </AppButton>
      </div>
    </header>

    <!-- Raccourci propriétaire : Mes biens + Ajouter un bien -->
    <AppCard v-if="role === 'landlord' && !loading" class="mb-6 p-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Building2 class="w-5 h-5 text-[var(--color-accent)]" />
            {{ t('landlord.myProperties') }}
          </h2>
          <p class="text-sm text-[var(--color-muted)] mt-1">{{ t('landlord.myPropertiesSubtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <AppButton variant="outline" size="sm" @click="router.push('/admin/landlord/properties')">
            {{ t('landlord.myProperties') }}
          </AppButton>
          <AppButton variant="primary" size="sm" @click="router.push('/admin/landlord/properties?openAdd=property')">
            <Plus class="w-4 h-4" />
            {{ t('landlord.addProperty') }}
          </AppButton>
        </div>
      </div>
    </AppCard>

    <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>
    <p v-else-if="loading" class="text-[var(--color-muted)]">
      {{ t('admin.loading') }}
    </p>

    <!-- Formulaire Ajouter un bien (2 étapes) -->
    <AppCard v-if="showAddForm" class="mb-6">
      <template #title>
        <AppTitle :level="3">{{ t('admin.formPropertyTitle') }}</AppTitle>
        <p class="text-xs text-[var(--color-muted)] mt-1">
          {{ formStep === 1 ? t('admin.formStep1') : t('admin.formStep2') }}
        </p>
      </template>
      <form class="space-y-4" @submit.prevent="submitCreate">
        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

        <!-- Étape 1 : Infos du bien -->
        <div v-show="formStep === 1" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput v-model="form.title" :label="t('admin.formPropertyTitleLabel')" />
          <AppInput v-model="form.city" :label="t('admin.formPropertyCity')" />
          <AppInput v-model="form.district" :label="t('admin.formPropertyDistrict')" />
          <AppInput v-model="form.address_details" :label="t('admin.formPropertyAddress')" />
          <AppInput
            v-model="form.price_monthly"
            type="number"
            :label="t('admin.formPropertyPrice')"
            :min="0"
          />
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-[var(--color-text)]">{{ t('admin.formPropertyStatus') }}</label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option v-for="s in PROPERTY_STATUSES" :key="s" :value="s">{{ t('admin.status.' + s) }}</option>
            </select>
          </div>
          <AppInput v-model="form.latitude" type="number" :label="t('admin.formPropertyLat')" :step="'any'" />
          <AppInput v-model="form.longitude" type="number" :label="t('admin.formPropertyLng')" :step="'any'" />
        </div>

        <!-- Étape 2 : Chambres -->
        <div v-show="formStep === 2">
          <p class="text-sm font-medium text-[var(--color-text)] mb-2">{{ t('admin.formRoomTitle') }}</p>
          <div v-for="(room, idx) in rooms" :key="idx" class="flex flex-wrap gap-2 items-end mb-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <AppInput v-model="room.name" :label="t('admin.formRoomName')" class="min-w-[120px]" />
            <div class="flex flex-col gap-1 min-w-[100px]">
              <label class="text-xs font-medium text-[var(--color-muted)]">{{ t('admin.formRoomType') }}</label>
              <select
                v-model="room.type"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <option v-for="rt in ROOM_TYPES" :key="rt" :value="rt">{{ t('admin.roomType.' + rt) }}</option>
              </select>
            </div>
            <AppInput v-model="room.price_monthly" type="number" :label="t('admin.formRoomPrice')" :min="0" />
            <AppInput v-model="room.surface_m2" type="number" :label="t('admin.formRoomSurface')" :min="0" />
            <AppInput v-model="room.floor" type="number" :label="t('admin.formRoomFloor')" :min="0" />
            <AppButton type="button" variant="ghost" size="sm" class="self-end" @click="removeRoomRow(idx)">×</AppButton>
          </div>
          <AppButton type="button" variant="outline" size="sm" @click="addRoomRow">
            {{ t('admin.addRoom') }}
          </AppButton>
        </div>

        <div class="flex flex-wrap gap-2 pt-2">
          <template v-if="formStep === 1">
            <AppButton type="button" variant="primary" @click="goToStep2">{{ t('admin.next') }}</AppButton>
            <AppButton type="button" variant="outline" @click="showAddForm = false">{{ t('admin.cancel') }}</AppButton>
          </template>
          <template v-else>
            <AppButton type="submit" :loading="creating">{{ creating ? t('admin.creating') : t('admin.create') }}</AppButton>
            <AppButton type="button" variant="outline" :disabled="creating" @click="goToStep1">{{ t('admin.back') }}</AppButton>
            <AppButton type="button" variant="ghost" :disabled="creating" @click="showAddForm = false">{{ t('admin.cancel') }}</AppButton>
          </template>
        </div>
      </form>
    </AppCard>

    <!-- Stats -->
    <section v-if="!loading" class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard :label="t('admin.statsProperties')" :value="ownedProperties.length" />
      <StatCard :label="t('admin.statsManaged')" :value="managedProperties.length" />
      <StatCard :label="t('admin.statsRooms')" :value="totalRooms" />
    </section>

    <div v-if="!loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #title>
          <h2 class="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Building2 class="w-4 h-4 text-[var(--color-accent)]" />
            {{ t('admin.ownerSection') }}
          </h2>
        </template>
        <AppParagraph muted small>{{ t('admin.ownerHint') }}</AppParagraph>
        <ul v-if="ownedProperties.length" class="space-y-2 mt-3">
          <li
            v-for="p in ownedProperties"
            :key="p.id"
            class="flex justify-between items-start gap-3 p-3 rounded-lg border border-gray-200 text-sm cursor-pointer hover:border-[var(--color-accent)]"
            @click="router.push(`/property/${p.id}`)"
          >
            <div class="min-w-0">
              <p class="font-medium text-[var(--color-text)] truncate">{{ p.name ?? p.title }}</p>
              <p class="flex items-center gap-1 text-[var(--color-muted)] text-xs mt-1">
                <MapPin class="w-3 h-3 shrink-0" />
                <span class="truncate">{{ typeof p.city === 'string' ? p.city : p.city?.name }}</span>
              </p>
            </div>
            <p class="text-[var(--color-accent)] font-semibold text-xs sm:text-sm">
              {{ formatPrice((p.price_monthly ?? p.units?.[0]?.price) ?? '0') }}
            </p>
          </li>
        </ul>
        <AppParagraph v-else muted small>{{ t('admin.ownerEmpty') }}</AppParagraph>
      </AppCard>

      <AppCard>
        <template #title>
          <h2 class="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
            <MapPin class="w-4 h-4 text-[var(--color-accent)]" />
            {{ t('admin.agentSection') }}
          </h2>
        </template>
        <AppParagraph muted small>{{ t('admin.agentHint') }}</AppParagraph>
        <ul v-if="managedProperties.length" class="space-y-2 mt-3">
          <li
            v-for="p in managedProperties"
            :key="p.id"
            class="flex justify-between items-start gap-3 p-3 rounded-lg border border-gray-200 text-sm cursor-pointer hover:border-[var(--color-accent)]"
            @click="router.push(`/property/${p.id}`)"
          >
            <div class="min-w-0">
              <p class="font-medium text-[var(--color-text)] truncate">{{ p.name ?? p.title }}</p>
              <p class="flex items-center gap-1 text-[var(--color-muted)] text-xs mt-1">
                <MapPin class="w-3 h-3 shrink-0" />
                <span class="truncate">{{ typeof p.city === 'string' ? p.city : p.city?.name }}</span>
              </p>
            </div>
            <p class="text-[var(--color-accent)] font-semibold text-xs sm:text-sm">
              {{ formatPrice((p.price_monthly ?? p.units?.[0]?.price) ?? '0') }}
            </p>
          </li>
        </ul>
        <AppParagraph v-else muted small>{{ t('admin.agentEmpty') }}</AppParagraph>
      </AppCard>
    </div>
  </main>
</template>
