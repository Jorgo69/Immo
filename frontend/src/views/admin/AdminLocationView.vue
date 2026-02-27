<script setup lang="ts">
/**
 * Gestion des pays et villes (référentiel) — Admin uniquement.
 * Liste + formulaire d'ajout (pays : nom, code ISO ; ville : pays, nom).
 */
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe, MapPin, Plus, Trash2 } from 'lucide-vue-next'
import { getCountries, getCities, createCountry, createCity, getNeighborhoods, createNeighborhood, deleteNeighborhood } from '../../services/location.service'
import type { CountryDto, CityDto, NeighborhoodDto } from '../../services/location.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppButton, AppCard, AppInput, AppTitle, AppParagraph } from '../../components/ui'

const { t } = useI18n()
const countries = ref<CountryDto[]>([])
const citiesByCountry = ref<Record<string, CityDto[]>>({})
const loading = ref(true)
const error = ref('')

const newCountry = ref({ name: '', iso_code: '' })
const newCity = ref({ country_id: '', name: '' })
const newNeighborhood = ref({ city_id: '', name: '' })

const creatingCountry = ref(false)
const creatingCity = ref(false)
const creatingNeighborhood = ref(false)
const deletingNeighborhoodId = ref<string | null>(null)

const neighborhoodsByCity = ref<Record<string, NeighborhoodDto[]>>({})

async function load() {
  loading.value = true
  error.value = ''
  try {
    countries.value = await getCountries()
    citiesByCountry.value = {}
    neighborhoodsByCity.value = {}
    for (const c of countries.value) {
      const cities = await getCities(c.id)
      citiesByCountry.value[c.id] = cities
      for (const city of cities) {
        neighborhoodsByCity.value[city.id] = await getNeighborhoods(city.id)
      }
    }
  } catch (e) {
    error.value = getApiErrorMessage(e)
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

async function addCountry() {
  const name = newCountry.value.name?.trim()
  const iso = newCountry.value.iso_code?.trim()?.toUpperCase()
  if (!name || !iso) {
    toast.error(t('admin.location.countryRequired'))
    return
  }
  creatingCountry.value = true
  try {
    await createCountry({ name, iso_code: iso })
    toast.success(t('admin.location.countryCreated'))
    newCountry.value = { name: '', iso_code: '' }
    await load()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingCountry.value = false
  }
}

async function addCity() {
  const country_id = newCity.value.country_id
  const name = newCity.value.name?.trim()
  if (!country_id || !name) {
    toast.error(t('admin.location.cityRequired'))
    return
  }
  creatingCity.value = true
  try {
    await createCity({ country_id, name })
    toast.success(t('admin.location.cityCreated'))
    newCity.value = { country_id: newCity.value.country_id, name: '' }
    await load()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingCity.value = false
  }
}

function citiesFor(countryId: string): CityDto[] {
  return citiesByCountry.value[countryId] ?? []
}

function neighborhoodsFor(cityId: string): NeighborhoodDto[] {
  return neighborhoodsByCity.value[cityId] ?? []
}

async function addNeighborhood() {
  const city_id = newNeighborhood.value.city_id
  const name = newNeighborhood.value.name?.trim()
  if (!city_id || !name) {
    toast.error(t('admin.location.neighborhoodRequired', 'Une ville et un nom sont requis'))
    return
  }
  creatingNeighborhood.value = true
  try {
    await createNeighborhood({ city_id, name })
    toast.success(t('admin.location.neighborhoodCreated', 'Quartier ajouté avec succès'))
    newNeighborhood.value = { city_id: newNeighborhood.value.city_id, name: '' }
    await load()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    creatingNeighborhood.value = false
  }
}

async function removeNeighborhood(id: string) {
  if (!confirm(t('admin.location.confirmDeleteNeighborhood', 'Voulez-vous vraiment supprimer ce quartier ?'))) return
  deletingNeighborhoodId.value = id
  try {
    await deleteNeighborhood(id)
    toast.success(t('admin.location.neighborhoodDeleted', 'Quartier supprimé avec succès'))
    await load()
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  } finally {
    deletingNeighborhoodId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <div>
      <AppTitle :level="2" class="flex items-center gap-2">
        <Globe class="w-7 h-7 text-[var(--color-accent)]" />
        {{ t('admin.location.title') }}
      </AppTitle>
      <AppParagraph muted class="mt-1">
        {{ t('admin.location.subtitle') }}
      </AppParagraph>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <AppCard v-if="loading" class="p-6">
      <p class="text-[var(--color-muted)]">{{ t('admin.location.loading') }}</p>
    </AppCard>

    <template v-else>
      <!-- Ajouter un pays -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Plus class="w-4 h-4" />
          {{ t('admin.location.addCountry') }}
        </h3>
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="addCountry">
          <AppInput
            v-model="newCountry.name"
            :label="t('admin.location.countryName')"
            :placeholder="t('admin.location.countryNamePlaceholder')"
            class="min-w-[180px]"
          />
          <AppInput
            v-model="newCountry.iso_code"
            :label="t('admin.location.isoCode')"
            placeholder="BJ"
            class="w-24"
            maxlength="3"
          />
          <AppButton type="submit" variant="primary" size="sm" :loading="creatingCountry">
            {{ t('admin.location.create') }}
          </AppButton>
        </form>
      </AppCard>

      <!-- Ajouter une ville -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Plus class="w-4 h-4" />
          {{ t('admin.location.addCity') }}
        </h3>
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="addCity">
          <div class="min-w-[200px]">
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('admin.location.country') }}</label>
            <select
              v-model="newCity.country_id"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text)]"
            >
              <option value="">{{ t('admin.location.selectCountry') }}</option>
              <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }} ({{ c.iso_code }})</option>
            </select>
          </div>
          <AppInput
            v-model="newCity.name"
            :label="t('admin.location.cityName')"
            :placeholder="t('admin.location.cityNamePlaceholder')"
            class="min-w-[180px]"
          />
          <AppButton type="submit" variant="primary" size="sm" :loading="creatingCity" :disabled="!newCity.country_id">
            {{ t('admin.location.create') }}
          </AppButton>
        </form>
      </AppCard>

      <!-- Ajouter un quartier -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <Plus class="w-4 h-4" />
          {{ t('admin.location.addNeighborhood', 'Ajouter un quartier') }}
        </h3>
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="addNeighborhood">
          <div class="min-w-[200px]">
            <label class="block text-sm font-medium text-[var(--color-text)] mb-1">{{ t('admin.location.city', 'Ville') }}</label>
            <select
              v-model="newNeighborhood.city_id"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text)]"
            >
              <option value="">{{ t('admin.location.selectCity', 'Sélectionner une ville...') }}</option>
              <template v-for="c in countries" :key="c.id">
                <optgroup :label="c.name">
                  <option v-for="city in citiesFor(c.id)" :key="city.id" :value="city.id">
                    {{ city.name }}
                  </option>
                </optgroup>
              </template>
            </select>
          </div>
          <AppInput
            v-model="newNeighborhood.name"
            :label="t('admin.location.neighborhoodName', 'Nom du quartier')"
            :placeholder="t('admin.location.neighborhoodNamePlaceholder', 'Ex: Fidjrossè')"
            class="min-w-[180px]"
          />
          <AppButton type="submit" variant="primary" size="sm" :loading="creatingNeighborhood" :disabled="!newNeighborhood.city_id">
            {{ t('admin.location.create', 'Créer') }}
          </AppButton>
        </form>
      </AppCard>

      <!-- Liste pays et villes -->
      <AppCard class="p-4">
        <h3 class="text-sm font-semibold text-[var(--color-text)] mb-4">{{ t('admin.location.list') }}</h3>
        <div class="space-y-4">
          <div
            v-for="c in countries"
            :key="c.id"
            class="rounded-lg border border-gray-200 dark:border-gray-600 p-3"
          >
            <p class="font-medium text-[var(--color-text)] flex items-center gap-2">
              <Globe class="w-4 h-4 text-[var(--color-accent)]" />
              {{ c.name }} ({{ c.iso_code }})
            </p>
            <ul v-if="citiesFor(c.id).length" class="mt-2 pl-6 flex flex-col gap-3 text-sm text-[var(--color-muted)]">
              <li v-for="city in citiesFor(c.id)" :key="city.id" class="flex flex-col gap-1">
                <div class="flex items-center gap-1 font-medium text-[var(--color-text)]">
                  <MapPin class="w-4 h-4 text-[var(--color-accent)]" />
                  {{ city.name }}
                </div>
                <div v-if="neighborhoodsFor(city.id).length" class="pl-5 flex flex-wrap gap-2">
                  <div
                    v-for="n in neighborhoodsFor(city.id)"
                    :key="n.id"
                    class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-md text-xs text-[var(--color-text)]"
                  >
                    {{ n.name }}
                    <button
                      type="button"
                      @click="removeNeighborhood(n.id)"
                      class="text-red-500 hover:text-red-700 ml-1 transition-colors disabled:opacity-50"
                      :disabled="deletingNeighborhoodId === n.id"
                      title="Supprimer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div v-else class="pl-5 text-xs text-gray-400 dark:text-gray-500">
                  {{ t('admin.location.noNeighborhoods', 'Aucun quartier') }}
                </div>
              </li>
            </ul>
            <p v-else class="mt-2 pl-6 text-sm text-[var(--color-muted)]">{{ t('admin.location.noCities') }}</p>
          </div>
          <p v-if="!countries.length" class="text-sm text-[var(--color-muted)]">{{ t('admin.location.noCountries') }}</p>
        </div>
      </AppCard>
    </template>
  </div>
</template>
