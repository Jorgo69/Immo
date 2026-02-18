<script setup lang="ts">
/**
 * Carte conteneur — bordure, fond blanc, coins arrondis.
 * Usage: <AppCard><template #title>Titre</template>Contenu</AppCard>
 */
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md'
  }>(),
  { padding: 'md' }
)
</script>

<template>
  <div
    :class="[
      'rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
      padding === 'none' && 'p-0',
      padding === 'sm' && 'p-3',
      padding === 'md' && 'p-4',
    ]"
  >
    <div v-if="$slots.title" class="mb-3">
      <slot name="title" />
    </div>
    <slot />
  </div>
</template>
