<script setup lang="ts">
/**
 * Sélecteur de devise : FCFA (XOF) par défaut, prêt pour Naira (NGN) et Dollar (USD).
 */
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { Banknote } from 'lucide-vue-next'

const appStore = useAppStore()

const currencyOptions: { value: string; label: string; symbol: string }[] = [
  { value: 'XOF', label: 'FCFA', symbol: 'FCFA' },
  { value: 'NGN', label: 'Naira', symbol: '₦' },
  { value: 'USD', label: 'Dollar', symbol: '$' },
]

const currentCurrency = computed(() => appStore.currency)

function setCurrency(value: string) {
  appStore.setCurrency(value)
}
</script>

<template>
  <div class="relative flex items-center gap-1 rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
    <Banknote class="ml-2 h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
    <select
      :value="currentCurrency"
      class="min-w-[5.5rem] cursor-pointer appearance-none rounded-lg bg-transparent py-2 pl-1 pr-7 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:bg-transparent"
      aria-label="Devise"
      @change="setCurrency(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in currencyOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs">▼</span>
  </div>
</template>
