<script setup lang="ts">
/**
 * Composant de chargement (Skeleton Screen).
 * Permet d'afficher des formes animées pour simuler le contenu en cours de chargement.
 * Design Soft Tech : animation pulse fluide, tons neutres s'adaptant au dark mode.
 */
interface Props {
  type?: 'line' | 'circle' | 'card' | 'rectangle' | 'text-title' | 'text-body' | 'property-card' | 'table-row'
  width?: string
  height?: string
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

withDefaults(defineProps<Props>(), {
  type: 'line',
  rounded: 'lg',
})
</script>

<template>
  <div v-if="type === 'property-card'" class="w-full flex flex-col bg-white/40 dark:bg-slate-900/40 rounded-6xl border border-white/20 dark:border-white/10 shadow-glass p-3 gap-4 animate-pulse">
    <!-- Image Box -->
    <div class="aspect-video w-full rounded-5xl bg-slate-200 dark:bg-slate-800" />
    
    <!-- Text Lines -->
    <div class="p-3 space-y-4">
      <div class="space-y-2">
        <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
      </div>
      <div class="flex items-center justify-between pt-2">
        <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/3" />
        <div class="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-8" />
      </div>
    </div>
  </div>

  <div v-else-if="type === 'table-row'" class="w-full flex items-center justify-between py-4 px-6 border-b border-gray-100 dark:border-gray-800 animate-pulse bg-white/20 dark:bg-white/5">
    <div class="flex gap-4 items-center w-1/3">
      <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
    </div>
    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
    <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
  </div>

  <div v-else
    class="animate-pulse bg-gray-200 dark:bg-gray-800 border-none"
    :class="[
      // Formes prédéfinies
      type === 'circle' && 'rounded-full aspect-square',
      type === 'card' && 'rounded-3xl h-32 w-full',
      type === 'line' && 'h-4 w-full rounded-md',
      type === 'text-title' && 'h-8 w-3/4 rounded-lg',
      type === 'text-body' && 'h-4 w-full rounded-md',
      type === 'rectangle' && 'w-full h-full',
      
      // Overrides de bordures si spécifié
      rounded === 'sm' && 'rounded-sm',
      rounded === 'md' && 'rounded-md',
      rounded === 'lg' && 'rounded-lg',
      rounded === 'xl' && 'rounded-xl',
      rounded === '2xl' && 'rounded-2xl',
      rounded === 'full' && 'rounded-full',
    ]"
    :style="{
      width: width || undefined,
      height: height || undefined,
    }"
  />
</template>

<style scoped>
.animate-pulse {
  animation: pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.2;
  }
}
</style>
