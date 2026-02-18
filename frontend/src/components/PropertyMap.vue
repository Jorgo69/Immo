<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface PropertyForMap {
  id: string
  title: string
  city?: string
  price_monthly?: string
  latitude?: string | null
  longitude?: string | null
}

const props = defineProps<{ properties: PropertyForMap[] }>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null

// Centre par défaut: Bénin (Cotonou)
const defaultCenter: [number, number] = [6.3703, 2.3912]
const defaultZoom = 10

function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value).setView(defaultCenter, defaultZoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)
  markersLayer = L.layerGroup().addTo(map)
  updateMarkers()
}

function updateMarkers() {
  if (!map || !markersLayer) return
  markersLayer.clearLayers()
  const withCoords = props.properties.filter(
    (p) => p.latitude != null && p.longitude != null && Number(p.latitude) && Number(p.longitude),
  )
  for (const p of withCoords) {
    const lat = Number(p.latitude)
    const lng = Number(p.longitude)
    const marker = L.marker([lat, lng])
      .bindPopup(`<strong>${escapeHtml(p.title)}</strong>${p.city ? `<br/>${escapeHtml(p.city)}` : ''}`)
    marker.on('click', () => emit('select', p.id))
    markersLayer!.addLayer(marker)
  }
  if (withCoords.length === 1) {
    map.setView([Number(withCoords[0].latitude), Number(withCoords[0].longitude)], 14)
  } else if (withCoords.length > 1) {
    const bounds = L.latLngBounds(withCoords.map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]))
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 })
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

onMounted(() => {
  initMap()
})
watch(() => props.properties, updateMarkers, { deep: true })
</script>

<template>
  <div ref="mapContainer" class="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100" />
</template>
