<script setup lang="ts">
/**
 * Carte de statistique Premium — Inspirée du design Behance/Soft Tech.
 * Utilise des arrondis 3xl, une typographie massive pour la valeur et un effet glow subtil.
 */
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon?: Component
    variant?: 'emerald' | 'orange' | 'red' | 'blue'
  }>(),
  { variant: 'emerald' }
)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-3xl border border-ui-border/50 bg-ui-surface p-5 transition-all hover:shadow-soft-lg dark:border-ui-border-dark/50 dark:bg-ui-surface-dark"
    :class="[
      variant === 'emerald' && 'shadow-glow-emerald',
      variant === 'orange' && 'shadow-glow-orange',
      variant === 'red' && 'shadow-glow-red',
      variant === 'blue' && 'shadow-soft',
    ]"
  >
    <!-- Background Decor (subtle glow top-right) -->
    <div 
      class="absolute -right-4 -top-4 h-16 w-16 opacity-10 blur-2xl"
      :class="[
        variant === 'emerald' && 'bg-primary-emerald',
        variant === 'orange' && 'bg-warning-orange',
        variant === 'red' && 'bg-danger-red',
        variant === 'blue' && 'bg-blue-500',
      ]"
    />

    <div class="relative flex flex-col gap-4">
      <div
        v-if="icon"
        class="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform hover:scale-110"
        :class="[
          variant === 'emerald' && 'bg-primary-emerald/10 text-primary-emerald',
          variant === 'orange' && 'bg-warning-orange/10 text-warning-orange',
          variant === 'red' && 'bg-danger-red/10 text-danger-red',
          variant === 'blue' && 'bg-blue-500/10 text-blue-500',
        ]"
      >
        <component :is="icon" :size="28" class="shrink-0" />
      </div>

      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-widest text-ui-muted">
          {{ label }}
        </p>
        <p
          class="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100"
        >
          {{ value }}
        </p>
      </div>
    </div>
  </div>
</template>
