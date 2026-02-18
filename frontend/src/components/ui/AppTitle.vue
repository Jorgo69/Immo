<script setup lang="ts">
/**
 * Titre typographique — niveaux h1 à h4, option sous-titre.
 */
withDefaults(
  defineProps<{
    level?: 1 | 2 | 3 | 4
    muted?: boolean
  }>(),
  { level: 1, muted: false }
)
</script>

<template>
  <component
    :is="level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'"
    :class="[
      'text-[var(--color-text)] tracking-tight',
      muted && 'text-[var(--color-muted)]',
      level === 1 && 'text-hero font-black',
      level === 2 && 'text-section-title font-extrabold',
      level === 3 && 'text-xl font-semibold',
      level === 4 && 'text-base font-medium',
    ]"
  >
    <slot />
  </component>
</template>
