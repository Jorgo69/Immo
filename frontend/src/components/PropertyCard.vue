<script setup lang="ts">
/**
 * Carte bien : mini-carrousel d'images (3–4 max), bouton Favoris (cœur), hover scale. Cliquable vers détail.
 * Les URLs d'images sont résolues via getUploadUrl (ARCHITECTURE §9).
 */
import { ref, computed } from 'vue'
import { MapPin, Heart } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { getUploadUrl } from '../config/api'
import AppImage from './ui/AppImage.vue'

const props = withDefaults(
  defineProps<{
    id: string
    title: string
    city: string
    priceMonthly: string
    imageUrl?: string | null
    media?: Array<{ id: string; url: string; type?: string }> | null
    variant?: 'default' | 'list'
  }>(),
  { media: null, variant: 'default' }
)

const emit = defineEmits<{ click: [id: string]; favorite: [id: string] }>()

const appStore = useAppStore()

const currentImageIndex = ref(0)

const images = computed(() => {
  if (props.media?.length) {
    return props.media.slice(0, 4).map((m) => getUploadUrl(m.url))
  }
  if (props.imageUrl) return [getUploadUrl(props.imageUrl)]
  return []
})

const hasMultipleImages = computed(() => images.value.length > 1)

function goToImage(index: number) {
  currentImageIndex.value = (index + images.value.length) % images.value.length
}

function formatPrice(value: string) {
  const currency = appStore.currency
  const num = Number(value)
  if (currency === 'USD') return '$' + new Intl.NumberFormat('en-US').format(num)
  if (currency === 'NGN') return '₦' + new Intl.NumberFormat('en-NG').format(num)
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA'
}

function toggleFavorite(e: Event) {
  e.stopPropagation()
  emit('favorite', props.id)
}
</script>

<template>
  <article
    data-hover-scale
    data-card-hover
    class="group relative flex h-full flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden cursor-pointer transition-colors hover:border-[var(--color-accent)]"
    @click="emit('click', id)"
  >
    <!-- Mini-carrousel d'images -->
    <div
      data-card-image
      :class="[
        'relative overflow-hidden will-change-transform bg-gray-100 dark:bg-gray-700',
        props.variant === 'list' ? 'aspect-square md:aspect-[4/3]' : 'aspect-[4/3]',
      ]"
    >
      <template v-if="images.length">
        <template v-for="(url, i) in images" :key="i">
          <AppImage
            v-show="i === currentImageIndex"
            :src="url"
            :alt="title"
            fit="cover"
            class="absolute inset-0 h-full w-full transition-opacity duration-300"
          />
        </template>
        <!-- Indicateurs si plusieurs images -->
        <div
          v-if="hasMultipleImages"
          class="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/40 px-2 py-1"
        >
          <button
            v-for="(_, i) in images"
            :key="i"
            type="button"
            class="h-1.5 w-1.5 rounded-full transition-all duration-200 focus:outline-none"
            :class="i === currentImageIndex ? 'w-3 bg-white' : 'bg-white/50'"
            :aria-label="`Image ${i + 1}`"
            @click.stop="goToImage(i)"
          />
        </div>
      </template>
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-[var(--color-muted)] text-sm"
      >
        {{ $t('property.noImage') }}
      </div>

      <!-- CTA Découvrir au centre de l'image -->
      <button
        v-if="props.variant === 'default'"
        type="button"
        data-card-cta
        class="absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-0"
        @click.stop="emit('click', id)"
      >
        <span
          class="inline-flex items-center justify-center rounded-full bg-black/70 px-5 py-2 text-sm font-medium text-white shadow-2xl backdrop-blur-sm"
        >
          {{ $t('home.discoverCard') }}
        </span>
      </button>

      <!-- Bouton Favoris (cœur) -->
      <button
        type="button"
        class="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 shadow-sm transition-colors hover:bg-white hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        :aria-label="$t('home.favorite')"
        @click="toggleFavorite"
      >
        <Heart class="h-4 w-4" />
      </button>
    </div>

    <div class="flex min-h-card-body flex-1 flex-col justify-between gap-3 p-4">
      <div class="min-h-card-title space-y-1.5">
        <h3
          :class="[
            'font-semibold text-[var(--color-text)] text-sm md:text-base',
            props.variant === 'list' ? 'line-clamp-1' : 'line-clamp-2',
          ]"
        >
          {{ title }}
        </h3>
        <p class="flex items-center gap-1 text-xs text-[var(--color-muted)] md:text-sm">
          <MapPin class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ city }}</span>
        </p>
      </div>
      <p class="text-sm font-semibold text-[var(--color-accent)]">
        {{ formatPrice(priceMonthly) }}
        <span class="font-normal text-[var(--color-muted)]">/ {{ $t('property.perMonth') }}</span>
      </p>
    </div>
  </article>
</template>
