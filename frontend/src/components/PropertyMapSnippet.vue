<script setup lang="ts">
/**
 * Carte statique (non déplaçable, sans zoom) avec cercle de localisation approximative.
 * Au clic, émet 'click' pour ouvrir le modal carte interactive.
 */
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = withDefaults(
  defineProps<{
    latitude: number
    longitude: number
    /** Rayon du cercle approximatif en mètres */
    radiusMeters?: number
    /** Zoom fixe de la carte */
    zoom?: number
  }>(),
  { radiusMeters: 600, zoom: 14 }
)
const emit = defineEmits<{ (e: 'click'): void }>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let circle: L.Circle | null = null

const center: [number, number] = [props.latitude, props.longitude]

function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value, {
    center,
    zoom: props.zoom,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    zoomControl: false,
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)
  circle = L.circle(center, {
    radius: props.radiusMeters,
    color: '#059669',
    fillColor: '#059669',
    fillOpacity: 0.15,
    weight: 2,
  }).addTo(map)
}

function updateCircle() {
  if (!map || !circle) return
  circle.setRadius(props.radiusMeters)
  circle.setLatLng(center)
}

onMounted(() => {
  initMap()
})
watch(() => [props.radiusMeters, props.latitude, props.longitude], updateCircle, { deep: true })

function onClick() {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    class="relative z-map w-full cursor-pointer rounded-xl overflow-hidden border border-ui-border bg-ui-background dark:border-ui-border-dark dark:bg-ui-surface-dark text-left focus:outline-none focus:ring-2 focus:ring-primary-emerald focus:ring-offset-2"
    @click="onClick"
  >
    <div
      ref="mapContainer"
      class="h-[200px] w-full min-h-[200px] touch-none select-none"
      aria-label="Voir la carte en grand"
    />
  </button>
</template>
