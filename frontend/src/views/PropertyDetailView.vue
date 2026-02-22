<script setup lang="ts">
/**
 * Page détail bien — UX centrée sur l'UNITÉ (chambre/appart).
 * Chaque unité = fiche produit complète avec CTA dédié.
 * Bloc flottant à droite mis à jour au scroll (unité en vue).
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  MapPin,
  Share2,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-vue-next'
import { getUploadUrl } from '../config/api'
import { getPropertyById, type PropertyDetailDto, type UnitDto } from '../services/property.service'
import { getApiErrorMessage } from '../services/http'
import { toast } from 'vue-sonner'
import PropertyMap, { type PropertyForMap } from '../components/PropertyMap.vue'
import { AppButton, AppCard } from '../components/ui'
import { gsap } from '../composables/useAnimations'

type PropertyDetailWithCoords = PropertyDetailDto & {
  latitude?: string | null
  longitude?: string | null
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '22990123456').replace(/\D/g, '')

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)
const property = ref<PropertyDetailWithCoords | null>(null)
const loading = ref(true)
const error = ref('')

const isLightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxImageRef = ref<HTMLImageElement | null>(null)
const lightboxImages = ref<Array<{ url: string }>>([])

/** Unité actuellement en vue (pour le bloc flottant). */
const activeUnitId = ref<string | null>(null)
const unitSectionRefs = ref<Map<string, HTMLElement>>(new Map())

async function fetchDetail() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  try {
    property.value = await getPropertyById(id.value)
    const firstUnit = property.value?.units?.[0] ?? property.value?.rooms?.[0]
    if (firstUnit) activeUnitId.value = firstUnit.id
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(t('property.loadError', { message: msg }))
    error.value = msg
  } finally {
    loading.value = false
  }
}

const propertyName = computed(() => property.value?.name ?? property.value?.title ?? '—')

const units = computed(() => property.value?.units ?? property.value?.rooms ?? [])

const mapProperties = computed<PropertyForMap[]>(() => {
  if (!property.value) return []
  const lat = (property.value.gps_latitude ?? (property.value as { latitude?: string }).latitude) as string | null | undefined
  const lng = (property.value.gps_longitude ?? (property.value as { longitude?: string }).longitude) as string | null | undefined
  if (!lat || !lng) return []
  return [
    {
      id: property.value.id,
      title: propertyName.value,
      city: typeof property.value.city === 'string' ? property.value.city : (property.value.city?.name ?? ''),
      price_monthly: units.value[0]?.price ?? '0',
      latitude: lat,
      longitude: lng,
    },
  ]
})

/** Unité active pour le bloc flottant (celle en vue ou la première). */
const activeUnit = computed(() => {
  if (!units.value.length) return null
  if (activeUnitId.value) {
    const u = units.value.find((x) => x.id === activeUnitId.value)
    if (u) return u
  }
  return units.value[0]
})

function formatPrice(value: string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function getUnitDescription(room: UnitDto): string {
  const d = room.description
  if (typeof d === 'string' && d.trim()) return d.trim()
  if (d && typeof d === 'object') {
    const fr = (d as Record<string, string>).fr?.trim()
    const en = (d as Record<string, string>).en?.trim()
    return (locale.value === 'fr' ? fr || en : en || fr) ?? ''
  }
  return ''
}

function getUnitFeatures(room: UnitDto): string[] {
  const f = room.features
  if (Array.isArray(f) && f.length) return f.filter((x) => typeof x === 'string')
  if (f && typeof f === 'object') {
    const fr = (f as Record<string, string[]>).fr
    const en = (f as Record<string, string[]>).en
    const list = locale.value === 'fr' ? fr || en : en || fr
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []
  }
  return []
}

function getUnitMoveInTotal(room: UnitDto): { rent: number; caution: number; avance: number; fees: number; total: number } {
  const rent = Number(room.price) || 0
  const cautionMonths = room.caution_months ?? 0
  const avanceMonths = room.avance_months ?? 0
  const fees = room.frais_dossier != null ? Number(room.frais_dossier) : 0
  const caution = cautionMonths * rent
  const avance = avanceMonths * rent
  const total = rent + caution + avance + fees
  return { rent, caution, avance, fees, total }
}

function hasUnitConditions(room: UnitDto): boolean {
  const rent = Number(room.price) || 0
  const hasCaution = (room.caution_months ?? 0) > 0
  const hasAvance = (room.avance_months ?? 0) > 0
  const hasFees = room.frais_dossier != null && Number(room.frais_dossier) > 0
  return rent > 0 || hasCaution || hasAvance || hasFees
}

/** Libellé du type d'unité (ref_type ou legacy type). */
function unitTypeLabel(room: UnitDto): string {
  if (room.ref_type) return locale.value === 'fr' ? room.ref_type.label_fr : (room.ref_type.label_en || room.ref_type.label_fr)
  return (room as { type?: string }).type ?? '—'
}

function unitIsAvailable(room: UnitDto): boolean {
  return room.unit_status === 'available' || room.is_available === true
}

/** Images d'une unité (unit.images ou fallback property.media). */
function getUnitImages(room: UnitDto): Array<{ url: string }> {
  const imgs = room.images
  if (Array.isArray(imgs) && imgs.length > 0) {
    return imgs.map((x) => (typeof x === 'string' ? { url: x } : { url: x.url }))
  }
  return property.value?.media ?? []
}

function getWhatsAppUrl(unit: UnitDto): string {
  const text = t('property.whatsappMessage', {
    unitName: unit.name ?? '',
    propertyName: propertyName.value,
  })
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

function getPropertyOnlyWhatsAppUrl(): string {
  const text = t('property.whatsappMessagePropertyOnly', {
    propertyName: propertyName.value,
  })
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

function setUnitSectionRef(id: string, el: unknown) {
  if (el instanceof HTMLElement) unitSectionRefs.value.set(id, el)
  else unitSectionRefs.value.delete(id)
}

let observer: IntersectionObserver | null = null

function setupScrollObserver() {
  if (observer) return
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const id = (entry.target as HTMLElement).dataset.unitId
        if (id) activeUnitId.value = id
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  )
  nextTick(() => {
    unitSectionRefs.value.forEach((el) => observer?.observe(el))
  })
}

function openLightbox(images: Array<{ url: string }>, index: number) {
  lightboxImages.value = images
  lightboxIndex.value = index
  isLightboxOpen.value = true
  nextTick(animateLightbox)
}

function closeLightbox() {
  isLightboxOpen.value = false
}

function prevImage() {
  if (!lightboxImages.value.length) return
  lightboxIndex.value = (lightboxIndex.value - 1 + lightboxImages.value.length) % lightboxImages.value.length
  nextTick(animateLightbox)
}

function nextImage() {
  if (!lightboxImages.value.length) return
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxImages.value.length
  nextTick(animateLightbox)
}

function animateLightbox() {
  if (!lightboxImageRef.value) return
  gsap.fromTo(lightboxImageRef.value, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
}

async function onShare() {
  if (typeof window === 'undefined') return
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title: propertyName.value, url })
    } catch {
      /* annulé */
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
  }
}

function onBack() {
  router.push('/property')
}

/** Description du bâtiment (avantages communs). */
const buildingDescription = computed(() => {
  const p = property.value
  if (!p) return ''
  const desc = (locale.value === 'fr' ? p.description?.fr : p.description?.en) || p.description?.fr || p.description?.en
  return desc ?? ''
})

watch(
  units,
  () => {
    observer?.disconnect()
    observer = null
    nextTick(() => nextTick(setupScrollObserver))
  },
  { flush: 'post' }
)

onMounted(() => {
  fetchDetail()
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <main class="max-w-layout mx-auto px-4 py-6 md:px-8 md:py-10">
    <div class="mb-4 flex items-center justify-between gap-2">
      <AppButton variant="ghost" size="sm" @click="onBack">
        <ArrowLeft class="h-5 w-5 shrink-0" />
        {{ t('property.back') }}
      </AppButton>
      <div class="hidden items-center gap-2 sm:flex">
        <AppButton variant="secondary" size="sm" @click="onShare">
          <Share2 class="h-4 w-4" />
          {{ t('property.share') }}
        </AppButton>
        <AppButton variant="ghost" size="sm">
          <Heart class="h-4 w-4" />
          {{ t('property.save') }}
        </AppButton>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="loading" class="text-sm text-[var(--color-muted)]">
      {{ t('profile.loading') }}
    </p>

    <template v-else-if="property">
      <!-- En-tête compact : bien + ville -->
      <header class="mb-6">
        <p class="text-sm text-[var(--color-muted)] flex items-center gap-1">
          <MapPin class="h-4 w-4 shrink-0" />
          {{ (typeof property.city === 'string' ? property.city : property.city?.name) || '—' }}{{ property.district ? ` · ${property.district}` : '' }}
        </p>
        <h1 class="text-xl font-semibold text-[var(--color-text)] mt-0.5">
          {{ propertyName }}
        </h1>
      </header>

      <section class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <!-- Colonne gauche : une fiche produit par unité -->
        <div class="space-y-12 lg:col-span-2">
          <template v-if="units.length">
            <article
              v-for="(room, index) in units"
              :key="room.id"
              :ref="(el) => setUnitSectionRef(room.id, el)"
              :data-unit-id="room.id"
              class="scroll-mt-32 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm"
            >
              <!-- Titre unité -->
              <div class="p-4 md:p-5 border-b border-gray-100 dark:border-gray-700">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h2 class="text-lg font-bold text-[var(--color-text)]">
                    {{ room.name ?? `Unité ${index + 1}` }}
                  </h2>
                  <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    :class="unitIsAvailable(room) ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                  >
                    {{ unitIsAvailable(room) ? t('property.roomAvailable') : t('property.roomUnavailable') }}
                  </span>
                </div>
                <p v-if="unitTypeLabel(room)" class="text-sm text-[var(--color-muted)] mt-0.5">{{ unitTypeLabel(room) }}</p>
              </div>

              <!-- Photos unité (ou bien) -->
              <div v-if="getUnitImages(room).length" class="aspect-[16/10] bg-gray-100 dark:bg-gray-800">
                <div class="flex h-full overflow-x-auto snap-x snap-mandatory">
                  <button
                    v-for="(img, i) in getUnitImages(room)"
                    :key="i"
                    type="button"
                    class="relative h-full min-w-full flex-1 snap-start overflow-hidden"
                    @click="openLightbox(getUnitImages(room), i)"
                  >
                    <img
                      :src="getUploadUrl(img.url)"
                      :alt="room.name"
                      class="h-full w-full object-cover transition hover:brightness-95"
                      loading="lazy"
                    />
                  </button>
                </div>
              </div>

              <!-- Description + Équipements (propres à l'unité) -->
              <div class="p-4 md:p-5 space-y-4">
                <p v-if="getUnitDescription(room)" class="text-sm text-[var(--color-text)]">
                  {{ getUnitDescription(room) }}
                </p>
                <div v-if="getUnitFeatures(room).length">
                  <h4 class="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-2">
                    {{ t('property.unitFeatures') }}
                  </h4>
                  <ul class="flex flex-wrap gap-2">
                    <li
                      v-for="(feat, idx) in getUnitFeatures(room)"
                      :key="idx"
                      class="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm text-[var(--color-text)]"
                    >
                      {{ feat }}
                    </li>
                  </ul>
                </div>

                <!-- Conditions d'entrée (détail) -->
                <div v-if="hasUnitConditions(room)" class="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <h4 class="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                    {{ t('property.conditionsTitle') }}
                  </h4>
                  <div class="space-y-1 text-sm text-[var(--color-text)]">
                    <div v-if="getUnitMoveInTotal(room).rent > 0" class="flex justify-between">
                      <span>{{ t('property.rent') }}</span>
                      <span>{{ formatPrice(room.price) }}</span>
                    </div>
                    <div v-if="(room.caution_months ?? 0) > 0" class="flex justify-between">
                      <span>{{ t('property.cautionMonths', { months: room.caution_months }) }}</span>
                      <span>{{ formatPrice(String(getUnitMoveInTotal(room).caution)) }}</span>
                    </div>
                    <div v-if="(room.avance_months ?? 0) > 0" class="flex justify-between">
                      <span>{{ t('property.avanceMonths', { months: room.avance_months }) }}</span>
                      <span>{{ formatPrice(String(getUnitMoveInTotal(room).avance)) }}</span>
                    </div>
                    <div v-if="room.frais_dossier != null && Number(room.frais_dossier) > 0" class="flex justify-between">
                      <span>{{ t('property.fees') }}</span>
                      <span>{{ formatPrice(room.frais_dossier) }}</span>
                    </div>
                  </div>
                  <!-- Total à payer pour intégrer — ultra visible -->
                  <div class="mt-4 rounded-xl bg-[var(--color-accent)]/10 dark:bg-[var(--color-accent)]/20 p-4">
                    <p class="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
                      {{ t('property.totalToPayLabel') }}
                    </p>
                    <p class="text-2xl font-bold text-[var(--color-accent)] mt-0.5">
                      {{ formatPrice(String(getUnitMoveInTotal(room).total)) }}
                    </p>
                  </div>
                </div>

                <!-- Bloc preuve sociale : situé dans + avantages bâtiment -->
                <div class="rounded-xl border border-gray-200 dark:border-gray-600 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                  <p class="text-sm font-semibold text-[var(--color-text)]">
                    {{ t('property.situatedIn') }} <strong>{{ propertyName }}</strong>
                  </p>
                  <p v-if="buildingDescription" class="mt-2 text-sm text-[var(--color-muted)]">
                    {{ buildingDescription }}
                  </p>
                </div>

                <!-- CTA unité : WhatsApp (un bouton par chambre) -->
                <div v-if="unitIsAvailable(room)" class="pt-2">
                  <a
                    :href="getWhatsAppUrl(room)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] px-4 py-3 text-white font-semibold hover:opacity-90 transition"
                  >
                    <MessageCircle class="h-5 w-5" />
                    {{ t('property.whatsappCta') }} — {{ room.name }}
                  </a>
                </div>
              </div>
            </article>
          </template>

          <!-- Fallback : aucun unité (bien seul) -->
          <article v-else class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <p class="text-[var(--color-muted)]">{{ t('property.noDescription') }}</p>
            <a
              v-if="property"
              :href="getPropertyOnlyWhatsAppUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-white font-semibold hover:opacity-90"
            >
              <MessageCircle class="h-5 w-5" />
              {{ t('property.whatsappCta') }}
            </a>
          </article>

          <!-- Carte (une fois pour le bien) -->
          <div v-if="mapProperties.length" class="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <h3 class="p-4 text-base font-semibold text-[var(--color-text)]">
              {{ t('property.locationTitle') }}
            </h3>
            <PropertyMap :properties="mapProperties" @select="() => {}" />
          </div>
        </div>

        <!-- Colonne droite : bloc flottant (unité en vue) -->
        <aside class="lg:col-span-1">
          <AppCard
            v-if="activeUnit"
            class="sticky top-28 space-y-4"
          >
            <p class="text-sm font-medium text-[var(--color-muted)]">
              {{ activeUnit.name }}
            </p>
            <p class="text-xl font-bold text-[var(--color-text)]">
              {{ formatPrice(activeUnit.price) }}
              <span class="text-sm font-normal text-[var(--color-muted)]"> / {{ t('property.perMonth') }}</span>
            </p>
            <div v-if="hasUnitConditions(activeUnit)" class="rounded-lg bg-[var(--color-accent)]/10 dark:bg-[var(--color-accent)]/20 p-3">
              <p class="text-xs font-medium text-[var(--color-muted)]">{{ t('property.totalToPayLabel') }}</p>
              <p class="text-lg font-bold text-[var(--color-accent)]">
                {{ formatPrice(String(getUnitMoveInTotal(activeUnit).total)) }}
              </p>
            </div>
            <p class="text-xs text-[var(--color-muted)]">
              {{ t('property.bookingHint') }}
            </p>
            <a
              v-if="unitIsAvailable(activeUnit)"
              :href="getWhatsAppUrl(activeUnit)"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] px-4 py-3 text-white font-semibold hover:opacity-90 transition"
            >
              <MessageCircle class="h-5 w-5" />
              {{ t('property.whatsappCta') }}
            </a>
          </AppCard>
        </aside>
      </section>
    </template>
  </main>

  <!-- Lightbox -->
  <teleport to="body">
    <div
      v-if="isLightboxOpen && lightboxImages.length"
      class="fixed inset-0 z-50 flex flex-col bg-black/90"
    >
      <div class="flex items-center justify-between px-4 py-3 text-sm text-white">
        <span>{{ lightboxIndex + 1 }} / {{ lightboxImages.length }}</span>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
          @click="closeLightbox"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <div class="relative flex flex-1 items-center justify-center px-4 pb-6">
        <button
          type="button"
          class="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:inline-flex"
          @click="prevImage"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>
        <img
          ref="lightboxImageRef"
          :src="getUploadUrl(lightboxImages[lightboxIndex]?.url)"
          :alt="activeUnit?.name ?? ''"
          class="max-h-full max-w-full rounded-2xl object-contain"
        />
        <button
          type="button"
          class="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:inline-flex"
          @click="nextImage"
        >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>
    </div>
  </teleport>
</template>
