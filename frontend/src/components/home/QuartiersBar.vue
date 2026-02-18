<script setup lang="ts">
/**
 * Barre de défilement horizontale : quartiers (Fidjrossè, Calavi, Akpakpa…) avec icônes circulaires.
 */
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MapPin, Building2, Home, TreePine } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()

const quartiers = [
  { id: 'fidjrosse', slug: 'fidjrosse', labelKey: 'home.quartiers.fidjrosse', icon: Building2 },
  { id: 'calavi', slug: 'calavi', labelKey: 'home.quartiers.calavi', icon: Home },
  { id: 'akpakpa', slug: 'akpakpa', labelKey: 'home.quartiers.akpakpa', icon: MapPin },
  { id: 'cotonou', slug: 'cotonou', labelKey: 'home.quartiers.cotonou', icon: Building2 },
  { id: 'godomey', slug: 'godomey', labelKey: 'home.quartiers.godomey', icon: TreePine },
  { id: 'abomey', slug: 'abomey', labelKey: 'home.quartiers.abomey', icon: MapPin },
]

function goToQuartier(slug: string) {
  router.push({ path: '/property', query: { city: slug } })
}
</script>

<template>
  <section class="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50" aria-label="Quartiers">
    <div class="max-w-layout mx-auto px-6 md:px-8 py-4">
      <div class="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:-mx-8 md:px-8">
        <button
          v-for="q in quartiers"
          :key="q.id"
          type="button"
          class="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-4 transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 dark:hover:bg-[var(--color-accent)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] min-w-[100px]"
          @click="goToQuartier(q.slug)"
        >
          <span
            class="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-700 text-[var(--color-accent)] shadow-sm"
          >
            <component :is="q.icon" class="h-6 w-6" />
          </span>
          <span class="text-xs font-medium text-[var(--color-text)] text-center leading-tight">
            {{ t(q.labelKey) }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>
