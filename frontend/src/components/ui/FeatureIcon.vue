<script setup lang="ts">
/**
 * FeatureIcon — Affiche une icône d'équipement.
 * Priorité : icon_lucide (nom Lucide) > icon_svg (SVG brut) > bullet par défaut.
 * Architecture §11 : composant atomique réutilisable dans les vues landlord, admin et tenant.
 */
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    /** Nom de l'icône Lucide, ex: "Droplets", "Wifi", "Car". Prioritaire. */
    iconLucide?: string | null
    /** SVG brut en fallback si iconLucide est absent. */
    iconSvg?: string | null
    /** Taille en pixels (prop Lucide). */
    size?: number
    /** Classe CSS supplémentaire. */
    class?: string
  }>(),
  { size: 18 },
)

/** Composant Lucide résolu dynamiquement si le nom est valide. */
const lucideComponent = computed(() => {
  if (!props.iconLucide) return null
  const icon = (LucideIcons as Record<string, unknown>)[props.iconLucide]
  return icon ?? null
})

const hasSvg = computed(() => !!props.iconSvg && !lucideComponent.value)
</script>

<template>
  <!-- Icône Lucide dynamique -->
  <component
    :is="lucideComponent"
    v-if="lucideComponent"
    :size="size"
    :class="props.class"
  />
  <!-- SVG custom brut -->
  <span
    v-else-if="hasSvg"
    v-html="iconSvg"
    :class="['inline-flex items-center justify-center', props.class]"
    :style="`width:${size}px;height:${size}px`"
  />
  <!-- Fallback : point coloré -->
  <span
    v-else
    class="inline-block rounded-full bg-primary-emerald"
    :style="`width:${Math.max(6, size / 3)}px;height:${Math.max(6, size / 3)}px`"
  />
</template>
