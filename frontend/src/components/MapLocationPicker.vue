<script setup lang="ts">
/**
 * Sélecteur de position sur carte : recherche d'adresse (géocodage Nominatim) + clic sur la carte pour choisir.
 * Émet latitude/longitude. Optionnel : initialiser avec lat/lng.
 */
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Corriger l’icône marker (chemin cassé en bundler)
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
const iconRetina = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
const defaultIcon = L.icon({ iconUrl, iconRetina, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] })
L.Marker.prototype.options.icon = defaultIcon

const props = withDefaults(
  defineProps<{
    latitude?: number | string | null
    longitude?: number | string | null
    height?: string
    placeholder?: string
    searchButtonLabel?: string
    clearLabel?: string
    hintText?: string
    /** Suggestion basée sur ville + pays (étape 1) : pré-remplit la recherche et lance une recherche au montage. */
    suggestedQuery?: string
    /** Texte affiché quand une suggestion a été utilisée (ex. "Exemple basé sur votre sélection…"). */
    suggestedHintText?: string
    errorNoResults?: string
    errorSearch?: string
  }>(),
  {
    height: '320px',
    placeholder: '',
    searchButtonLabel: 'Rechercher',
    clearLabel: 'Effacer',
    hintText: 'Tapez une adresse ou un lieu puis cliquez sur la carte pour placer le repère.',
    suggestedQuery: '',
    suggestedHintText: '',
    errorNoResults: 'Aucun résultat.',
    errorSearch: 'Recherche impossible.',
  }
)

const emit = defineEmits<{
  (e: 'update:latitude', value: number | ''): void
  (e: 'update:longitude', value: number | ''): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const searchLoading = ref(false)
const searchError = ref('')

let map: L.Map | null = null
let marker: L.Marker | null = null

const defaultCenter: [number, number] = [6.3703, 2.3912] // Cotonou
const defaultZoom = 12

function parseNum(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n) ? null : n
}

function setMarker(lat: number, lng: number) {
  if (!map) return
  if (marker) map.removeLayer(marker)
  marker = L.marker([lat, lng]).addTo(map)
  map.setView([lat, lng], map.getZoom())
  emit('update:latitude', lat)
  emit('update:longitude', lng)
}

function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value).setView(defaultCenter, defaultZoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)

  const initialLat = parseNum(props.latitude)
  const initialLng = parseNum(props.longitude)
  if (initialLat != null && initialLng != null) {
    setMarker(initialLat, initialLng)
  }

  map.on('click', (e: L.LeafletMouseEvent) => {
    setMarker(e.latlng.lat, e.latlng.lng)
  })
}

async function search() {
  const q = searchQuery.value?.trim()
  if (!q) return
  searchLoading.value = true
  searchError.value = ''
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'fr' },
    })
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      searchError.value = props.errorNoResults
      return
    }
    const first = data[0]
    const lat = parseFloat(first.lat)
    const lng = parseFloat(first.lon)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return
    setMarker(lat, lng)
    searchError.value = ''
  } catch (e) {
    searchError.value = props.errorSearch
  } finally {
    searchLoading.value = false
  }
}

function clearLocation() {
  if (marker && map) {
    map.removeLayer(marker)
    marker = null
  }
  emit('update:latitude', '')
  emit('update:longitude', '')
}

const hasUsedSuggestion = ref(false)

onMounted(() => {
  initMap()
  const q = props.suggestedQuery?.trim()
  if (q) {
    searchQuery.value = q
    hasUsedSuggestion.value = true
    setTimeout(() => search(), 400)
  }
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
  marker = null
})

watch(
  () => [props.latitude, props.longitude] as const,
  ([lat, lng]) => {
    const la = parseNum(lat)
    const lo = parseNum(lng)
    if (map && la != null && lo != null && marker) {
      marker.setLatLng([la, lo])
      map.setView([la, lo], map.getZoom())
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="space-y-2">
    <div class="flex gap-2">
      <input
        v-model="searchQuery"
        type="text"
        class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text)] placeholder-[var(--color-muted)] focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
        :placeholder="placeholder"
        @keydown.enter.prevent="search"
      />
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        :disabled="searchLoading || !searchQuery?.trim()"
        @click="search"
      >
        {{ searchLoading ? '…' : searchButtonLabel }}
      </button>
    </div>
    <p v-if="searchError" class="text-sm text-red-600">{{ searchError }}</p>
    <p v-if="suggestedHintText && hasUsedSuggestion" class="text-xs text-[var(--color-accent)]">
      {{ suggestedHintText }}
    </p>
    <p class="text-xs text-[var(--color-muted)]">
      {{ hintText }}
    </p>
    <div ref="mapContainer" class="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100" :style="{ height }" />
    <div v-if="latitude != null && latitude !== '' && longitude != null && longitude !== ''" class="flex items-center gap-2 text-sm text-[var(--color-muted)]">
      <span>{{ latitude }}, {{ longitude }}</span>
      <button type="button" class="text-[var(--color-accent)] hover:underline" @click="clearLocation">
        {{ clearLabel }}
      </button>
    </div>
  </div>
</template>
