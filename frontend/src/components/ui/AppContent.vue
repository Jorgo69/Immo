<script setup lang="ts">
/**
 * Conteneur de contenu — pilote la largeur et les marges horizontales.
 * Variants : standard (centré, espaces), immersive (pleine largeur), narrow (formulaires).
 * Évolutif : ajouter de nouvelles variantes dans variantClasses sans casser les vues.
 */
type Variant = 'standard' | 'immersive' | 'narrow'

const props = withDefaults(
  defineProps<{
    /** standard = centré max-w-layout + padding | immersive = pleine largeur (padding mobile) | narrow = max-w-xl formulaires */
    variant?: Variant
    /** Élément HTML racine (sémantique). */
    tag?: 'div' | 'main' | 'section' | 'article'
  }>(),
  { variant: 'standard', tag: 'div' }
)

const variantClasses: Record<Variant, string> = {
  standard:
    'max-w-layout mx-auto px-4 py-4 md:px-8 md:py-6',
  immersive:
    'w-full px-4 py-4 lg:px-6',
  narrow:
    'max-w-xl mx-auto px-4 py-4 md:px-6',
}

const containerClass = variantClasses[props.variant]
</script>

<template>
  <component
    :is="tag"
    class="app-content"
    :class="containerClass"
  >
    <slot />
  </component>
</template>
