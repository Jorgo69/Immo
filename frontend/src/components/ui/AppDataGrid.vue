<script setup lang="ts">
/**
 * AppDataGrid — Grille responsive configurable.
 * 
 * Usage :
 * <AppDataGrid :items="data" :cols="3" gap="md">
 *   <template #item="{ item, index }">
 *     <AppCard>...</AppCard>
 *   </template>
 * </AppDataGrid>
 */

const props = withDefaults(
  defineProps<{
    items: any[]
    /** Nombre de colonnes en desktop (1-4) */
    cols?: 1 | 2 | 3 | 4
    /** Espacement entre les éléments */
    gap?: 'sm' | 'md' | 'lg'
    /** Clé de chaque élément */
    itemKey?: string
  }>(),
  { cols: 3, gap: 'md', itemKey: 'id' }
)

const colsClass: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

const gapClass: Record<string, string> = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}
</script>

<template>
  <div :class="['grid', colsClass[cols] ?? colsClass[3], gapClass[gap] ?? gapClass.md]">
    <div v-for="(item, index) in items" :key="item[itemKey] ?? index">
      <slot name="item" :item="item" :index="index" />
    </div>
  </div>
</template>
