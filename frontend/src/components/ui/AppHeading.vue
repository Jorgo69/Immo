<script setup lang="ts">
/**
 * Heading typographique haut niveau — hero & titres de section.
 * Utilise les tailles configurées dans tailwind.config (text-hero, text-section-title).
 */
withDefaults(
  defineProps<{
    variant?: 'hero' | 'section'
    as?: 'h1' | 'h2' | 'h3' | 'h4'
    align?: 'left' | 'center'
  }>(),
  {
    variant: 'section',
    as: 'h2',
    align: 'left',
  }
)
</script>

<template>
  <component
    :is="as"
    :class="[
      'tracking-tight',
      align === 'center' && 'text-center',
      align === 'left' && 'text-left',
      variant === 'hero' && 'text-hero font-black',
      variant === 'section' && 'text-section-title font-extrabold',
    ]"
  >
    <slot />
  </component>
</template>

