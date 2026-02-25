<script setup lang="ts">
/**
 * Page détail bien — Galerie immersive type Marketplace (70% écran) + colonne détails sticky (30%).
 * Galerie : fond flou (image cover) + image nette au centre (object-contain) + flèches + thumbnails cliquables.
 * Carte en flux normal avec z-map ; modal carte sans chevauchement. CTA WhatsApp + Appeler visibles au scroll.
 */
import { ref, computed, watch, onMounted, nextTick } from 'vue'
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
  Phone,
  Car,
  Users,
  Zap,
  Wifi,
} from 'lucide-vue-next'
import { getUploadUrl } from '../config/api'
import { getPropertyById, type PropertyDetailDto, type UnitDto } from '../services/property.service'
import { createRentalRequest } from '../services/rental.service'
import { getMe } from '../services/auth.service'
import { getApiErrorMessage } from '../services/http'
import { toast } from 'vue-sonner'
import { useAppStore } from '../stores/app'
import PropertyMap, { type PropertyForMap } from '../components/PropertyMap.vue'
import PropertyMapSnippet from '../components/PropertyMapSnippet.vue'
import { AppButton, AppCard, AppModal, AppContent } from '../components/ui'
import RentalRequestForm from '../components/rental/RentalRequestForm.vue'
import { gsap } from '../composables/useAnimations'

type PropertyDetailWithCoords = PropertyDetailDto & {
  latitude?: string | null
  longitude?: string | null
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '22990123456').replace(/\D/g, '')
const PHONE_E164 = WHATSAPP_NUMBER.startsWith('229') ? `+${WHATSAPP_NUMBER}` : `+229${WHATSAPP_NUMBER}`

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)
const property = ref<PropertyDetailWithCoords | null>(null)
const loading = ref(true)
const error = ref('')

const selectedUnitId = ref<string | null>(null)
const carouselIndex = ref(0)

const isLightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxImageRef = ref<HTMLImageElement | null>(null)
const lightboxImages = ref<Array<{ url: string }>>([])

const showRequestModal = ref(false)
const requestModalUnit = ref<UnitDto | null>(null)
const submittingRequest = ref(false)
const userVerified = ref(true)
const appStore = useAppStore()

const showMapModal = ref(false)

async function openRequestModal(unit: UnitDto) {
  if (!appStore.token) {
    toast.info(t('rental.loginRequired'))
    router.push({ name: 'auth', query: { redirect: route.fullPath } })
    return
  }
  requestModalUnit.value = unit
  showRequestModal.value = true
  try {
    const me = await getMe()
    userVerified.value = me.is_verified === true
  } catch {
    userVerified.value = false
  }
}

function closeRequestModal() {
  showRequestModal.value = false
  requestModalUnit.value = null
}

async function onRequestSubmit(payload: { unit_id: string; message: string; desired_move_in_at?: string }) {
  submittingRequest.value = true
  try {
    await createRentalRequest(payload)
    toast.success(t('rental.requestSent'))
    closeRequestModal()
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(t('rental.requestError', { message: msg }))
  } finally {
    submittingRequest.value = false
  }
}

async function fetchDetail() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  try {
    property.value = await getPropertyById(id.value)
    const first = property.value?.units?.[0] ?? property.value?.rooms?.[0]
    if (first) selectedUnitId.value = first.id
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

const selectedUnit = computed(() => {
  if (!units.value.length) return null
  if (selectedUnitId.value) {
    const u = units.value.find((x) => x.id === selectedUnitId.value)
    if (u) return u
  }
  return units.value[0]
})

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
      price_monthly: selectedUnit.value?.price ?? '0',
      latitude: lat,
      longitude: lng,
    },
  ]
})

const mapSnippetCoords = computed(() => {
  const list = mapProperties.value
  if (!list.length) return null
  const lat = Number(list[0].latitude)
  const lng = Number(list[0].longitude)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  return { latitude: lat, longitude: lng }
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

/** Icône Lucide pour un équipement (Car, Wifi, Zap, Users). */
function featureIcon(feat: string): 'car' | 'wifi' | 'zap' | 'users' | null {
  const lower = feat.toLowerCase()
  if (lower.includes('parking') || lower.includes('véhicule') || lower.includes('vehicle') || lower.includes('voiture') || lower.includes('car')) return 'car'
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) return 'wifi'
  if (lower.includes('compteur') || lower.includes('électricité') || lower.includes('electricity') || lower.includes('prepaid') || lower.includes('prepay')) return 'zap'
  return null
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

function unitTypeLabel(room: UnitDto): string {
  if (room.ref_type) return locale.value === 'fr' ? room.ref_type.label_fr : (room.ref_type.label_en || room.ref_type.label_fr)
  return (room as { type?: string }).type ?? '—'
}

function unitIsAvailable(room: UnitDto): boolean {
  return room.unit_status === 'available' || room.is_available === true
}

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

function carouselPrev() {
  const imgs = selectedUnit.value ? getUnitImages(selectedUnit.value) : []
  if (!imgs.length) return
  carouselIndex.value = (carouselIndex.value - 1 + imgs.length) % imgs.length
}

function carouselNext() {
  const imgs = selectedUnit.value ? getUnitImages(selectedUnit.value) : []
  if (!imgs.length) return
  carouselIndex.value = (carouselIndex.value + 1) % imgs.length
}

function setCarouselIndex(i: number) {
  carouselIndex.value = i
}

watch(selectedUnitId, () => {
  carouselIndex.value = 0
})

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
  router.push('/explore')
}

const buildingDescription = computed(() => {
  const p = property.value
  if (!p) return ''
  const desc = (locale.value === 'fr' ? p.description?.fr : p.description?.en) || p.description?.fr || p.description?.en
  return desc ?? ''
})

const carouselImages = computed(() => (selectedUnit.value ? getUnitImages(selectedUnit.value) : []))

const carouselCurrentUrl = computed(() => {
  const list = carouselImages.value
  if (!list.length) return ''
  const idx = carouselIndex.value % list.length
  return getUploadUrl(list[idx]?.url ?? '')
})

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <AppContent tag="main" variant="immersive">
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

    <p v-if="error" class="text-sm text-danger-red">{{ error }}</p>
    <p v-else-if="loading" class="text-sm text-ui-muted">
      {{ t('profile.loading') }}
    </p>

    <template v-else-if="property">
      <!-- Layout fullscreen-ish : galerie h-screen-nav (100vh - navbar), détails à droite scrollables -->
      <section class="grid grid-cols-1 gap-6 lg:grid-cols-10 lg:gap-8 lg:min-h-screen-nav">
        <!-- Gauche : galerie immersive, toute la hauteur disponible -->
        <div class="lg:col-span-7 lg:h-screen-nav min-h-[50vh] lg:min-h-0">
          <div
            v-if="carouselImages.length"
            class="relative h-full w-full overflow-hidden rounded-2xl border border-ui-border bg-ui-background dark:border-ui-border-dark dark:bg-ui-surface-dark"
          >
            <!-- Effet miroir (background) : cover + flou 40px + assombrissement pour faire ressortir l'image -->
            <div class="absolute inset-0 w-full h-full">
              <img
                v-if="carouselCurrentUrl"
                :src="carouselCurrentUrl"
                alt=""
                class="absolute inset-0 w-full h-full object-cover blur-gallery brightness-gallery scale-110"
                aria-hidden="true"
              />
            </div>
            <!-- Image principale (foreground) : relative, h-full w-full object-contain, jamais rognée -->
            <div class="relative h-full w-full flex items-center justify-center px-16 py-4">
              <button
                type="button"
                class="absolute left-3 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow-soft border border-white/20 hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-primary-emerald dark:bg-black/50 dark:hover:bg-black/65"
                aria-label="Photo précédente"
                @click="carouselPrev"
              >
                <ChevronLeft class="h-7 w-7" />
              </button>
              <button
                type="button"
                class="absolute right-3 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow-soft border border-white/20 hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-primary-emerald dark:bg-black/50 dark:hover:bg-black/65"
                aria-label="Photo suivante"
                @click="carouselNext"
              >
                <ChevronRight class="h-7 w-7" />
              </button>
              <button
                type="button"
                class="h-full w-full flex items-center justify-center"
                @click="openLightbox(carouselImages, carouselIndex)"
              >
                <img
                  :src="carouselCurrentUrl"
                  :alt="selectedUnit?.name ?? propertyName"
                  class="max-h-full max-w-full w-full h-full object-contain rounded-xl shadow-soft"
                  loading="eager"
                />
              </button>
            </div>
            <!-- Thumbnails : overlay en bas, sans réduire la zone de l'image principale -->
            <div class="absolute bottom-0 left-0 right-0 flex justify-center gap-2 border-t border-ui-border/80 bg-ui-surface/90 dark:border-ui-border-dark dark:bg-ui-surface-dark/90 p-3">
              <button
                v-for="(img, i) in carouselImages"
                :key="i"
                type="button"
                class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-emerald"
                :class="i === carouselIndex ? 'border-primary-emerald ring-2 ring-primary-emerald/30' : 'border-ui-border dark:border-ui-border-dark hover:border-ui-border-hover'"
                @click="setCarouselIndex(i)"
              >
                <img
                  :src="getUploadUrl(img.url)"
                  :alt="`Photo ${i + 1}`"
                  class="h-full w-full object-cover"
                />
              </button>
            </div>
          </div>
          <div
            v-else
            class="h-full min-h-[50vh] lg:min-h-screen-nav rounded-2xl border border-ui-border bg-ui-background dark:border-ui-border-dark flex items-center justify-center text-ui-muted"
          >
            {{ t('property.noImage') }}
          </div>
        </div>

        <!-- Droite : détails dans le flux (relative), colonne scrollable -->
        <div class="lg:col-span-3 lg:min-h-screen-nav lg:overflow-y-auto lg:sticky lg:top-0 space-y-4 relative">
          <header>
            <p class="text-sm text-ui-muted flex items-center gap-1">
              <MapPin class="h-4 w-4 shrink-0" />
              {{ (typeof property.city === 'string' ? property.city : property.city?.name) || '—' }}{{ property.district ? ` · ${property.district}` : '' }}
            </p>
            <h1 class="text-xl font-semibold text-[var(--color-text)] mt-0.5">
              {{ propertyName }}
            </h1>
          </header>

          <template v-if="selectedUnit">
            <div v-if="units.length > 1" class="flex flex-wrap gap-2">
              <button
                v-for="(u, idx) in units"
                :key="u.id"
                type="button"
                class="rounded-xl border px-3 py-2 text-sm font-medium transition"
                :class="u.id === selectedUnitId ? 'border-primary-emerald bg-primary-emerald-light text-primary-emerald dark:bg-primary-emerald/20 dark:text-primary-emerald' : 'border-ui-border bg-ui-surface text-ui-muted hover:border-ui-border-hover dark:border-ui-border-dark dark:bg-ui-surface-dark dark:hover:border-ui-muted'"
                @click="selectedUnitId = u.id"
              >
                {{ u.name ?? `Unité ${idx + 1}` }}
              </button>
            </div>

            <!-- Bloc Prix : loyer en gros + total à payer -->
            <AppCard class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="rounded-full px-3 py-1 text-xs font-medium"
                  :class="unitIsAvailable(selectedUnit) ? 'bg-status-open-green/15 text-status-open-green dark:bg-status-open-green/25' : 'bg-ui-muted/20 text-ui-muted dark:bg-ui-muted/30'"
                >
                  {{ unitIsAvailable(selectedUnit) ? t('property.roomAvailable') : t('property.roomUnavailable') }}
                </span>
                <span class="text-sm text-ui-muted">{{ unitTypeLabel(selectedUnit) }}</span>
              </div>
              <p class="text-2xl font-bold text-[var(--color-text)]">
                {{ formatPrice(selectedUnit.price) }}
                <span class="text-base font-normal text-ui-muted"> / {{ t('property.perMonth') }}</span>
              </p>
              <div v-if="hasUnitConditions(selectedUnit)" class="rounded-xl bg-primary-emerald/10 dark:bg-primary-emerald/20 p-3">
                <p class="text-xs font-medium text-ui-muted uppercase tracking-wide">{{ t('property.totalToPayLabel') }}</p>
                <p class="text-lg font-bold text-primary-emerald">
                  {{ formatPrice(String(getUnitMoveInTotal(selectedUnit).total)) }}
                </p>
              </div>
            </AppCard>

            <!-- CTA principaux : Je suis intéressé + WhatsApp + Appeler (visibles au scroll) -->
            <div v-if="unitIsAvailable(selectedUnit)" class="space-y-2">
              <AppButton variant="primary" block class="w-full" @click="openRequestModal(selectedUnit)">
                {{ t('property.bookingCta') }}
              </AppButton>
              <a
                :href="getWhatsAppUrl(selectedUnit)"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] px-4 py-3 text-white font-semibold hover:opacity-90 transition"
              >
                <MessageCircle class="h-5 w-5" />
                {{ t('property.whatsappCta') }}
              </a>
              <a
                :href="`tel:${PHONE_E164}`"
                class="flex items-center justify-center gap-2 w-full rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-[var(--color-text)] font-medium hover:bg-ui-background dark:border-ui-border-dark dark:bg-ui-surface-dark dark:hover:bg-ui-surface-dark/80 transition"
              >
                <Phone class="h-5 w-5" />
                {{ t('property.callCta') }}
              </a>
            </div>

            <!-- Localisation : carte statique dans le flux (z-map sur le snippet) -->
            <div v-if="mapSnippetCoords" class="space-y-2">
              <h3 class="text-sm font-semibold text-[var(--color-text)]">
                {{ t('property.locationTitle') }}
              </h3>
              <PropertyMapSnippet
                :latitude="mapSnippetCoords.latitude"
                :longitude="mapSnippetCoords.longitude"
                :radius-meters="500"
                @click="showMapModal = true"
              />
              <p class="text-xs text-ui-muted">
                {{ (typeof property.city === 'string' ? property.city : property.city?.name) || '' }}
                · {{ t('property.locationApproximate') }}
              </p>
            </div>

            <!-- Conditions d'entrée -->
            <div v-if="hasUnitConditions(selectedUnit)" class="rounded-2xl border border-ui-border bg-ui-surface dark:border-ui-border-dark dark:bg-ui-surface-dark p-4 space-y-2">
              <h3 class="text-sm font-semibold text-ui-muted uppercase tracking-wide">{{ t('property.conditionsTitle') }}</h3>
              <div class="space-y-1 text-sm text-[var(--color-text)]">
                <div v-if="getUnitMoveInTotal(selectedUnit).rent > 0" class="flex justify-between">
                  <span>{{ t('property.rent') }}</span>
                  <span>{{ formatPrice(selectedUnit.price) }}</span>
                </div>
                <div v-if="(selectedUnit.caution_months ?? 0) > 0" class="flex justify-between">
                  <span>{{ t('property.cautionMonths', { months: selectedUnit.caution_months }) }}</span>
                  <span>{{ formatPrice(String(getUnitMoveInTotal(selectedUnit).caution)) }}</span>
                </div>
                <div v-if="(selectedUnit.avance_months ?? 0) > 0" class="flex justify-between">
                  <span>{{ t('property.avanceMonths', { months: selectedUnit.avance_months }) }}</span>
                  <span>{{ formatPrice(String(getUnitMoveInTotal(selectedUnit).avance)) }}</span>
                </div>
                <div v-if="selectedUnit.frais_dossier != null && Number(selectedUnit.frais_dossier) > 0" class="flex justify-between">
                  <span>{{ t('property.fees') }}</span>
                  <span>{{ formatPrice(selectedUnit.frais_dossier) }}</span>
                </div>
              </div>
            </div>

            <!-- Équipements avec icônes Lucide (Car, Wifi, Zap, Users) -->
            <div v-if="getUnitFeatures(selectedUnit).length || units.length" class="space-y-2">
              <h3 class="text-sm font-semibold text-[var(--color-text)]">{{ t('property.unitFeatures') }}</h3>
              <ul class="flex flex-wrap gap-2">
                <li
                  v-for="(feat, idx) in getUnitFeatures(selectedUnit)"
                  :key="idx"
                  class="inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface px-3 py-1.5 text-sm text-[var(--color-text)] dark:border-ui-border-dark dark:bg-ui-surface-dark"
                >
                  <Car v-if="featureIcon(feat) === 'car'" class="h-4 w-4 shrink-0 text-primary-emerald" />
                  <Wifi v-else-if="featureIcon(feat) === 'wifi'" class="h-4 w-4 shrink-0 text-primary-emerald" />
                  <Zap v-else-if="featureIcon(feat) === 'zap'" class="h-4 w-4 shrink-0 text-primary-emerald" />
                  <span>{{ feat }}</span>
                </li>
              </ul>
              <p v-if="units.length" class="flex items-center gap-2 text-sm text-ui-muted">
                <Users class="h-4 w-4 shrink-0" />
                {{ units.length }} {{ t('landlord.kpi.households') }}
              </p>
            </div>

            <!-- Description -->
            <div v-if="getUnitDescription(selectedUnit)" class="space-y-1">
              <h3 class="text-sm font-semibold text-[var(--color-text)]">{{ t('property.descriptionTitle') }}</h3>
              <p class="text-sm text-ui-muted">{{ getUnitDescription(selectedUnit) }}</p>
            </div>

            <!-- Bâtiment -->
            <div class="rounded-2xl border border-ui-border bg-ui-background p-4 dark:border-ui-border-dark dark:bg-ui-surface-dark">
              <p class="text-sm font-semibold text-[var(--color-text)]">
                {{ t('property.situatedIn') }} <strong>{{ propertyName }}</strong>
              </p>
              <p v-if="buildingDescription" class="mt-2 text-sm text-ui-muted">
                {{ buildingDescription }}
              </p>
            </div>
          </template>

          <template v-else>
            <AppCard>
              <p class="text-ui-muted">{{ t('property.noDescription') }}</p>
              <a
                :href="getPropertyOnlyWhatsAppUrl()"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-white font-semibold hover:opacity-90"
              >
                <MessageCircle class="h-5 w-5" />
                {{ t('property.whatsappCta') }}
              </a>
              <a
                :href="`tel:${PHONE_E164}`"
                class="mt-2 flex items-center justify-center gap-2 rounded-xl border border-ui-border bg-ui-surface px-4 py-3 text-[var(--color-text)] font-medium dark:border-ui-border-dark dark:bg-ui-surface-dark"
              >
                <Phone class="h-5 w-5" />
                {{ t('property.callCta') }}
              </a>
            </AppCard>
          </template>
        </div>
      </section>
    </template>
  </AppContent>

  <AppModal
    :show="showRequestModal"
    :title="t('property.bookingCta')"
    @close="closeRequestModal"
  >
    <RentalRequestForm
      v-if="requestModalUnit"
      :unit-id="requestModalUnit.id"
      :unit-name="requestModalUnit.name"
      :show="showRequestModal"
      :loading="submittingRequest"
      :user-verified="userVerified"
      @submit="onRequestSubmit"
      @close="closeRequestModal"
    />
  </AppModal>

  <AppModal
    :show="showMapModal"
    :title="t('property.mapModalTitle')"
    @close="showMapModal = false"
  >
    <div class="space-y-4">
      <div v-if="mapProperties.length" class="relative z-map h-[400px] w-full rounded-xl overflow-hidden border border-ui-border dark:border-ui-border-dark">
        <PropertyMap :properties="mapProperties" @select="() => {}" />
      </div>
      <AppButton variant="primary" block @click="showMapModal = false">
        {{ t('property.mapDone') }}
      </AppButton>
    </div>
  </AppModal>

  <teleport to="body">
    <div
      v-if="isLightboxOpen && lightboxImages.length"
      class="fixed inset-0 z-modal flex flex-col bg-overlay"
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
          :alt="selectedUnit?.name ?? ''"
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
