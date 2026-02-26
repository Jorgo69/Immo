<script setup lang="ts">
/**
 * Composant de galerie d'images intelligent.
 * Détermine l'image principale et la galerie à partir de toutes les sources (media, gallery, mainImage),
 * et garantit l'ordre et le fallback corrects.
 */
import { computed } from 'vue'
import PropertyCardImage from '../landlord/PropertyCardImage.vue'
import { getUploadUrl } from '../../config/api'

export interface ImageMedia {
  url: string
  is_primary?: boolean
}

const props = withDefaults(defineProps<{
  media?: ImageMedia[]
  gallery?: string[]
  mainImage?: string | null
  mode?: 'primary' | 'gallery'
  alt?: string
  limit?: number
}>(), {
  mode: 'primary',
  alt: 'Image',
  media: () => [],
  gallery: () => [],
  limit: 4
})

const emit = defineEmits(['click-image'])

const allImageUrls = computed(() => {
  const urls: string[] = []
  
  // 1. Ajouter les médias en priorité
  if (props.media && props.media.length > 0) {
    const sorted = [...props.media].sort((a, b) => {
      // Les is_primary en premier
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return 0
    })
    sorted.forEach(m => {
      if (m.url && !urls.includes(m.url)) urls.push(m.url)
    })
  }

  // 2. L'image principale si pas déjà présente
  if (props.mainImage && !urls.includes(props.mainImage)) {
    urls.unshift(props.mainImage)
  }

  // 3. String de la galerie si pas déjà présents
  if (props.gallery && props.gallery.length > 0) {
    props.gallery.forEach(g => {
      if (g && !urls.includes(g)) urls.push(g)
    })
  }

  return urls.map(u => getUploadUrl(u))
})

const primaryImage = computed(() => {
  return allImageUrls.value.length > 0 ? allImageUrls.value[0] : ''
})

const galleryImages = computed(() => {
  // On exclut l'image principale pour ne pas l'afficher en double dans la galerie
  return allImageUrls.value.length > 1 ? allImageUrls.value.slice(1, props.limit + 1) : []
})
</script>

<template>
  <template v-if="mode === 'primary'">
    <PropertyCardImage :src="primaryImage" :alt="alt" />
  </template>
  
  <template v-else-if="mode === 'gallery'">
    <div v-if="galleryImages.length > 0" class="grid grid-cols-2 gap-3">
      <div 
        v-for="(img, idx) in galleryImages" 
        :key="idx" 
        class="aspect-square rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-transform cursor-pointer"
        @click="emit('click-image', img)"
      >
        <PropertyCardImage :src="img" :alt="`${alt} ${idx + 1}`" />
      </div>
    </div>
    <div v-else class="text-slate-400 text-sm italic py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
      Aucune autre photo.
    </div>
  </template>
</template>
