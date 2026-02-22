<script setup lang="ts">
/**
 * Image avec placeholder — affiche une image par défaut si src vide ou si le chargement échoue (lien mort).
 * Usage : profils, biens, cartes.
 */
import { ref, watch, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    /** URL de l'image de remplacement (optionnel). Sinon placeholder interne. */
    placeholder?: string | null
    /** Format : cover (remplit) ou contain */
    fit?: 'cover' | 'contain'
    /** Classes additionnelles sur le conteneur */
    class?: string
  }>(),
  { fit: 'cover' }
)

const failed = ref(false)
const effectiveSrc = computed(() => {
  if (failed.value || !props.src?.trim()) return null
  return props.src
})


/** Placeholder par défaut : SVG data URL (icône image cassée / silhouette). */
const defaultPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

const placeholderSrc = computed(() => props.placeholder?.trim() || defaultPlaceholder)

function onError() {
  failed.value = true
}

watch(
  () => props.src,
  () => {
    failed.value = false
  }
)
</script>

<template>
  <div
    class="overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center w-full h-full"
    :class="props.class"
  >
    <img
      v-if="effectiveSrc"
      :src="effectiveSrc"
      :alt="alt ?? ''"
      class="w-full h-full"
      :class="fit === 'contain' ? 'object-contain' : 'object-cover'"
      @error="onError"
    />
    <img
      v-else
      :src="placeholderSrc"
      :alt="alt ?? ''"
      class="w-full h-full object-contain p-4 opacity-60"
      role="presentation"
    />
  </div>
</template>
