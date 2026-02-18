<script setup lang="ts">
/**
 * Hero plein écran (80vh) : carrousel d'images, overlay sombre, titre + barre de recherche centrale (style Airbnb/Bien'ici).
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search } from 'lucide-vue-next'
import { AppHeading } from '../ui'

const { t } = useI18n()
const router = useRouter()

const searchQuery = ref('')
const currentSlide = ref(0)

const heroImages = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
]

const SLIDE_INTERVAL = 5500
let intervalId: ReturnType<typeof setInterval> | null = null

function goToSlide(index: number) {
  currentSlide.value = (index + heroImages.length) % heroImages.length
}

function startCarousel() {
  intervalId = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % heroImages.length
  }, SLIDE_INTERVAL)
}

function stopCarousel() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function submitSearch() {
  const q = searchQuery.value.trim()
  if (q) {
    router.push({ path: '/property', query: { q } })
  } else {
    router.push('/property')
  }
}

onMounted(() => startCarousel())
onUnmounted(() => stopCarousel())
</script>

<template>
  <section class="relative h-[80vh] min-h-[420px] w-full overflow-hidden">
    <!-- Carrousel -->
    <div class="absolute inset-0">
      <template v-for="(img, i) in heroImages" :key="i">
        <div
          class="absolute inset-0 transition-opacity duration-700 ease-out"
          :class="i === currentSlide ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'"
        >
          <img
            :src="img"
            :alt="`Slide ${i + 1}`"
            class="h-full w-full object-cover"
            loading="eager"
            fetchpriority="high"
          />
        </div>
      </template>
    </div>

    <!-- Overlay sombre (dégradé sobre pour lisibilité) -->
    <div
      class="absolute inset-0 z-10 bg-black/50"
      aria-hidden="true"
    />

    <!-- Contenu : titre + barre de recherche centrale -->
    <div class="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-white">
      <AppHeading
        variant="hero"
        as="h1"
        align="center"
        class="mb-6 max-w-2xl text-balance"
      >
        {{ t('home.welcome') }}
      </AppHeading>
      <p class="text-center text-base md:text-lg text-white/90 mb-8 max-w-xl">
        {{ t('home.intro') }}
      </p>

      <!-- Barre de recherche centrale (style Airbnb/Zillow) -->
      <form
        class="flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:items-center rounded-full bg-white/95 shadow-2xl overflow-hidden backdrop-blur-sm"
        @submit.prevent="submitSearch"
      >
        <div class="flex flex-1 items-center gap-3 px-6 py-3 sm:py-3.5">
          <Search class="h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('property.searchPlaceholder')"
            class="min-w-0 flex-1 border-0 bg-transparent text-base text-[var(--color-text)] placeholder:text-gray-400 focus:outline-none focus:ring-0"
            autocomplete="off"
          />
        </div>
        <button
          type="submit"
          class="shrink-0 bg-[var(--color-accent)] px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-accent)]"
        >
          {{ t('home.ctaSearch') }}
        </button>
      </form>
    </div>

    <!-- Indicateurs de slide -->
    <div class="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
      <button
        v-for="(_, i) in heroImages"
        :key="i"
        type="button"
        class="h-2 w-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/80"
        :class="i === currentSlide ? 'w-6 bg-white' : 'bg-white/60 hover:bg-white/80'"
        :aria-label="`Slide ${i + 1}`"
        @click="goToSlide(i); stopCarousel(); startCarousel()"
      />
    </div>
  </section>
</template>
