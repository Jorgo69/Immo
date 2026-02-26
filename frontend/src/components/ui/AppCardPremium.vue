<script setup lang="ts">
/**
 * Carte conteneur Premium — Style Glassmorphism / Behance.
 * Utilise des arrondis 3xl, une bordure translucide fine et un fond ui-surface.
 */
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg'
    glass?: boolean
  }>(),
  { padding: 'md', glass: false }
)
</script>

<template>
  <div
    class="rounded-3xl border border-ui-border/40 bg-ui-surface shadow-soft transition-all duration-300 dark:border-ui-border-dark/40 dark:bg-ui-surface-dark"
    :class="[
      padding === 'none' && 'p-0',
      padding === 'sm' && 'p-4',
      padding === 'md' && 'p-6',
      padding === 'lg' && 'p-8',
      glass && 'backdrop-blur-md bg-ui-surface/80 dark:bg-ui-surface-dark/80',
    ]"
  >
    <div v-if="$slots.title" class="mb-5">
      <slot name="title" />
    </div>
    <slot />
  </div>
</template>
