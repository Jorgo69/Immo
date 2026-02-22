<script setup lang="ts">
/**
 * Placeholder stylé quand le bien n'a pas d'image principale (is_primary).
 * Affiche le logo / nom "Immo Bénin" — réutilisable (ARCHITECTURE).
 */
import { Building2 } from 'lucide-vue-next'
</script>

<template>
  <div
    class="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-[var(--color-muted)]"
    aria-hidden="true"
  >
    <Building2 class="w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-70" />
    <span class="text-xs font-medium tracking-wide">Immo Bénin</span>
  </div>
</template>
