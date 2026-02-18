<script setup lang="ts">
/**
 * Carte de statistique — label + valeur (Espace pro, dashboard).
 */
defineProps<{
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="p-3 rounded-xl border border-gray-200 bg-white">
    <p class="text-[10px] text-[var(--color-muted)] mb-1 uppercase tracking-wide">
      <slot name="label">{{ label }}</slot>
    </p>
    <p class="text-lg font-semibold text-[var(--color-text)]">
      <slot name="value">{{ value }}</slot>
    </p>
  </div>
</template>
