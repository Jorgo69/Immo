<script setup lang="ts">
/**
 * Sélecteur de devise : FCFA (XOF) par défaut, prêt pour Naira (NGN) et Dollar (USD).
 */
import { computed, onMounted } from 'vue'
import { useAppStore } from '../../stores/app'
import { useCurrency } from '../../composables/useCurrency'
import { Banknote } from 'lucide-vue-next'

const appStore = useAppStore()
const { rates, loadRates } = useCurrency()

onMounted(() => {
  loadRates()
})

const currentCurrency = computed({
  get: () => appStore.currency,
  set: (value: string) => {
    appStore.setCurrency(value)
  },
})
</script>

<template>
  <div
    class="relative flex items-center gap-1 rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
  >
    <Banknote class="ml-2 h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
    <select
      v-model="currentCurrency"
      class="min-w-[5.5rem] cursor-pointer appearance-none rounded-lg bg-transparent py-2 pl-1 pr-7 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:bg-transparent"
      aria-label="Devise"
    >
      <option v-for="opt in rates" :key="opt.currency_code" :value="opt.currency_code">
        {{ opt.currency_symbol || opt.currency_code }}
      </option>
    </select>
    <span
      class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs"
    >
      ▼
    </span>
  </div>
</template>
