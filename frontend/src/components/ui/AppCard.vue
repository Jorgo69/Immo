<script setup lang="ts">
/**
 * Carte conteneur — structure standard (annonces, contenu, listes).
 * ARCHITECTURE §2 & §11 : tokens thème uniquement, mode dark, rounded-2xl, shadow-soft.
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
      'rounded-2xl border border-ui-border dark:border-gray-600 bg-ui-surface dark:bg-gray-800 shadow-soft',
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
