<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
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
  Wifi,
  Car,
  Droplets,
  Zap,
} from 'lucide-vue-next'
import { getPropertyById, type PropertyDetailDto, type RoomDto } from '../services/property.service'
import PropertyMap, { type PropertyForMap } from '../components/PropertyMap.vue'
import { AppButton, AppCard, AppParagraph } from '../components/ui'
import { gsap } from '../composables/useAnimations'

type PropertyDetailWithCoords = PropertyDetailDto & {
  latitude?: string | null
  longitude?: string | null
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)

const property = ref<PropertyDetailWithCoords | null>(null)
const loading = ref(true)
const error = ref('')

const isLightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxImageRef = ref<HTMLImageElement | null>(null)

const mobileCarouselRef = ref<HTMLElement | null>(null)
const mobileCurrentIndex = ref(0)

async function fetchDetail() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  try {
    property.value = await getPropertyById(id.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    loading.value = false
  }
}

const images = computed(() => property.value?.media ?? [])
const hasImages = computed(() => images.value.length > 0)

const mainImage = computed(() => (images.value.length ? images.value[0] : null))
const secondaryImages = computed(() => (images.value.length > 1 ? images.value.slice(1, 5) : []))

const mapProperties = computed<PropertyForMap[]>(() => {
  if (!property.value) return []
  const lat = (property.value as any).latitude as string | null | undefined
  const lng = (property.value as any).longitude as string | null | undefined
  if (!lat || !lng) return []
  return [
    {
      id: property.value.id,
      title: property.value.title,
      city: property.value.city,
      price_monthly: property.value.price_monthly,
      latitude: lat,
      longitude: lng,
    },
  ]
})

function formatPrice(value: string | null | undefined) {
  if (!value) return ''
  return new Intl.NumberFormat('fr-FR').format(Number(value)) + ' FCFA'
}

function openLightbox(index: number) {
  if (!images.value.length) return
  lightboxIndex.value = index
  isLightboxOpen.value = true
  nextTick(() => {
    animateLightbox()
  })
}

function closeLightbox() {
  isLightboxOpen.value = false
}

function prevImage() {
  if (!images.value.length) return
  lightboxIndex.value = (lightboxIndex.value - 1 + images.value.length) % images.value.length
  animateLightbox()
}

function nextImage() {
  if (!images.value.length) return
  lightboxIndex.value = (lightboxIndex.value + 1) % images.value.length
  animateLightbox()
}

function animateLightbox() {
  if (!lightboxImageRef.value) return
  gsap.fromTo(
    lightboxImageRef.value,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    },
  )
}

function handleMobileScroll() {
  const el = mobileCarouselRef.value
  if (!el || !images.value.length) return
  const index = Math.round(el.scrollLeft / el.clientWidth)
  mobileCurrentIndex.value = Math.min(Math.max(index, 0), images.value.length - 1)
}

async function onShare() {
  if (typeof window === 'undefined') return
  const url = window.location.href
  const title = property.value?.title ?? t('property.detail')
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
    } catch {
      // utilisateur a annulé, pas de bruit
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // ignore
    }
  }
}

function onBack() {
  router.push('/property')
}

onMounted(fetchDetail)
</script>

<template>
  <main class="max-w-layout mx-auto px-4 py-6 md:px-8 md:py-10">
    <!-- Back + top actions -->
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
      <!-- Mobile title + actions -->
      <header class="mb-4 space-y-2 sm:mb-6">
        <div class="flex items-start justify-between gap-3">
          <h1 class="text-balance text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl">
            {{ property.title }}
          </h1>
          <div class="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
              @click="onShare"
            >
              <Share2 class="h-3.5 w-3.5" />
              {{ t('property.share') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-gray-700 shadow-sm"
            >
              <Heart class="h-4 w-4" />
            </button>
          </div>
        </div>
        <p class="flex items-center gap-1 text-sm text-gray-600">
          <MapPin class="h-4 w-4 shrink-0" />
          <span class="truncate">
            {{ property.city }}{{ property.district ? ` · ${property.district}` : '' }}
          </span>
        </p>
      </header>

      <!-- Header photos -->
      <section v-if="hasImages" class="mb-8">
        <!-- Mobile carousel -->
        <div class="-mx-4 mb-3 block lg:hidden">
          <div
            ref="mobileCarouselRef"
            class="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
            @scroll.passive="handleMobileScroll"
          >
            <div
              v-for="(img, index) in images"
              :key="img.id ?? index"
              class="relative h-full w-screen shrink-0 snap-start"
            >
              <img
                :src="img.url"
                :alt="property.title"
                class="h-64 w-full object-cover sm:h-80"
                loading="lazy"
                @click="openLightbox(index)"
              />
            </div>
          </div>
          <div class="mt-2 flex items-center justify-end px-4 text-xs font-medium text-gray-700">
            {{ mobileCurrentIndex + 1 }} / {{ images.length }}
          </div>
        </div>

        <!-- Desktop grid 5 images -->
        <div
          v-if="mainImage"
          class="hidden aspect-video gap-2 rounded-3xl lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        >
          <button
            type="button"
            class="relative h-full w-full overflow-hidden rounded-3xl"
            @click="openLightbox(0)"
          >
            <img
              :src="mainImage.url"
              :alt="property.title"
              class="h-full w-full object-cover transition duration-300 hover:brightness-90"
              loading="lazy"
            />
          </button>
          <div class="grid grid-cols-2 grid-rows-2 gap-2">
            <button
              v-for="(img, index) in secondaryImages"
              :key="img.id ?? index"
              type="button"
              class="relative h-full w-full overflow-hidden rounded-3xl"
              @click="openLightbox(index + 1)"
            >
              <img
                :src="img.url"
                :alt="property.title"
                class="h-full w-full object-cover transition duration-300 hover:brightness-90"
                loading="lazy"
              />
            </button>
          </div>
        </div>
      </section>

      <!-- Main layout -->
      <section class="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <!-- Left column: details -->
        <div class="space-y-6 lg:col-span-2">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ t('property.hostTitle') }}
            </h2>
            <p class="mt-1 text-sm text-gray-600">
              {{ t('property.hostSubtitle') }}
            </p>
          </div>

          <div v-if="property.description_translations?.fr">
            <h3 class="mb-2 text-base font-semibold text-gray-900">
              {{ t('property.descriptionTitle') }}
            </h3>
            <AppParagraph class="text-sm text-gray-600">
              {{ property.description_translations.fr }}
            </AppParagraph>
          </div>

          <!-- Amenities -->
          <div>
            <h3 class="mb-3 text-base font-semibold text-gray-900">
              {{ t('property.amenitiesTitle') }}
            </h3>
            <div class="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
              <div class="flex items-center gap-2">
                <Wifi class="h-4 w-4 text-[var(--color-accent)]" />
                <span>{{ t('property.amenitiesWifi') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Car class="h-4 w-4 text-[var(--color-accent)]" />
                <span>{{ t('property.amenitiesParking') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Droplets class="h-4 w-4 text-[var(--color-accent)]" />
                <span>{{ t('property.amenitiesWater') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Zap class="h-4 w-4 text-[var(--color-accent)]" />
                <span>{{ t('property.amenitiesElectricity') }}</span>
              </div>
            </div>
          </div>

          <!-- Rooms list (optionnel mais utile) -->
          <div v-if="property.rooms?.length">
            <h3 class="mb-3 text-base font-semibold text-gray-900">
              {{ t('property.roomsTitle') }}
            </h3>
            <ul class="space-y-3 text-sm text-gray-700">
              <li
                v-for="room in property.rooms as RoomDto[]"
                :key="room.id"
                class="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900">
                    {{ room.name }}
                  </p>
                  <p v-if="room.type" class="mt-0.5 text-xs text-gray-600">
                    {{ room.type }}
                  </p>
                  <p
                    v-if="room.description_translations?.fr"
                    class="mt-1 text-xs text-gray-600 line-clamp-2"
                  >
                    {{ room.description_translations.fr }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs" :class="room.is_available ? 'text-green-600' : 'text-red-600'">
                    {{ room.is_available ? t('property.roomAvailable') : t('property.roomUnavailable') }}
                  </p>
                  <p v-if="room.price_monthly" class="mt-1 text-xs font-semibold text-[var(--color-accent)]">
                    {{ formatPrice(room.price_monthly) }} / {{ t('property.perMonth') }}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Map -->
          <div v-if="mapProperties.length">
            <h3 class="mb-3 text-base font-semibold text-gray-900">
              {{ t('property.locationTitle') }}
            </h3>
            <PropertyMap :properties="mapProperties" @select="() => {}" />
          </div>
        </div>

        <!-- Right column: Booking card -->
        <aside class="lg:col-span-1">
          <AppCard class="sticky top-28 space-y-4">
            <div class="flex items-baseline justify-between gap-2">
              <p class="text-xl font-semibold text-gray-900">
                {{ formatPrice(property.price_monthly) }}
                <span class="text-sm font-normal text-gray-600">
                  / {{ t('property.perMonth') }}
                </span>
              </p>
            </div>
            <p class="text-xs text-gray-600">
              {{ t('property.bookingHint') }}
            </p>
            <AppButton
              variant="primary"
              size="lg"
              class="w-full"
            >
              {{ t('property.bookingCta') }}
            </AppButton>
          </AppCard>
        </aside>
      </section>
    </template>
  </main>

  <!-- Lightbox -->
  <teleport to="body">
    <div
      v-if="isLightboxOpen && images.length"
      class="fixed inset-0 z-50 flex flex-col bg-black/90"
    >
      <div class="flex items-center justify-between px-4 py-3 text-sm text-white">
        <span>{{ lightboxIndex + 1 }} / {{ images.length }}</span>
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
          :src="images[lightboxIndex].url"
          :alt="property?.title ?? ''"
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
