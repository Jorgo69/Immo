<script setup lang="ts">
/**
 * Carte de statistique (KPI) — label + valeur, optionnellement icône et style alerte.
 * Conforme ARCHITECTURE §2 : tokens Tailwind uniquement, mode dark pris en compte.
 */
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    /** Composant icône (ex: TrendingUp, Home) pour affichage à gauche. */
    icon?: Component
    /** Style alerte (ex: unités vacantes > 0) : bordure/ fond warning. */
    alert?: boolean
  }>(),
  { alert: false }
)
</script>

<template>
  <div
    class="rounded-2xl border shadow-soft p-4 flex items-center gap-3 transition-colors"
    :class="alert
      ? 'border-warning-orange/50 dark:border-warning-orange/50 bg-warning-orange-light/30 dark:bg-warning-orange/10'
      : 'border-ui-border dark:border-ui-border-dark bg-ui-surface dark:bg-ui-surface-dark'"
  >
    <div
      v-if="icon"
      class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-primary-emerald"
      :class="alert
        ? 'bg-warning-orange/20 text-warning-orange'
        : 'bg-primary-emerald/10 text-primary-emerald'"
    >
      <component :is="icon" :size="24" class="shrink-0 text-current" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs text-ui-muted dark:text-ui-muted uppercase tracking-wide">
        <slot name="label">{{ label }}</slot>
      </p>
      <p
        class="text-lg font-semibold truncate"
        :class="alert ? 'text-warning-orange' : 'text-gray-900 dark:text-gray-100'"
      >
        <slot name="value">{{ value }}</slot>
      </p>
    </div>
  </div>
</template>
