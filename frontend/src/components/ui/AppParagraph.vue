<script setup lang="ts">
/**
 * Paragraphe — taille et couleur cohérentes.
 */
withDefaults(
  defineProps<{
    muted?: boolean
    small?: boolean
  }>(),
  { muted: false, small: false }
)
</script>

<template>
  <p
    :class="[
      'text-[var(--color-text)]',
      muted && 'text-[var(--color-muted)]',
      small && 'text-xs',
      !small && 'text-sm md:text-base',
    ]"
  >
    <slot />
  </p>
</template>
