<script setup lang="ts">
/**
 * Image de bien avec fallback (ARCHITECTURE §2, §6).
 * Affiche l'image avec loading="lazy" ; en cas d'erreur de chargement (URL invalide, contenu non image),
 * affiche le placeholder Immo Bénin pour une UX propre.
 *
 * @props src - URL de l'image (déjà résolue via getUploadUrl)
 * @props alt - Texte alternatif
 * @props rounded - 'none' | 'full' pour miniature ronde dans le tableau
 */
import { ref, watch } from 'vue'
import PropertyImagePlaceholder from './PropertyImagePlaceholder.vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    rounded?: 'none' | 'full'
  }>(),
  { rounded: 'none' }
)

const loadFailed = ref(false)

watch(
  () => props.src,
  () => { loadFailed.value = false },
  { immediate: true }
)

function onError() {
  loadFailed.value = true
}
</script>

<template>
  <div
    class="w-full h-full flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700"
    :class="rounded === 'full' ? 'rounded-full' : ''"
  >
    <img
      v-if="src && !loadFailed"
      :src="src"
      :alt="alt ?? ''"
      loading="lazy"
      class="w-full h-full object-cover"
      :class="rounded === 'full' ? 'rounded-full' : ''"
      @error="onError"
    />
    <PropertyImagePlaceholder v-else :class="rounded === 'full' ? 'rounded-full' : ''" />
  </div>
</template>
