<script setup lang="ts">
/**
 * Pagination réutilisable — à intégrer partout où une liste paginée est affichée.
 * Props : page courante, totalPages, total, limit.
 * Émet : page-change(page: number).
 */
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import AppButton from './AppButton.vue'

const props = withDefaults(
  defineProps<{
    page: number
    totalPages: number
    total: number
    limit: number
    /** Masquer si une seule page ou aucun résultat */
    hideIfSinglePage?: boolean
  }>(),
  { hideIfSinglePage: true },
)

const emit = defineEmits<{ 'page-change': [page: number] }>()

const rangeStart = computed(() =>
  props.total === 0 ? 0 : (props.page - 1) * props.limit + 1,
)
const rangeEnd = computed(() =>
  props.total === 0 ? 0 : Math.min(props.page * props.limit, props.total),
)
const hasPrev = computed(() => props.page > 1)
const hasNext = computed(() => props.page < props.totalPages)
const visible = computed(
  () =>
    !props.hideIfSinglePage ||
    (props.totalPages > 1 || (props.totalPages === 1 && props.total > 0)),
)

function go(page: number) {
  if (page < 1 || page > props.totalPages) return
  emit('page-change', page)
}
</script>

<template>
  <nav
    v-if="visible"
    class="flex flex-wrap items-center justify-between gap-3 py-4"
    aria-label="Pagination"
  >
    <p class="text-sm text-[var(--color-muted)]">
      {{ $t('pagination.range', { start: rangeStart, end: rangeEnd, total }) }}
    </p>
    <div class="flex items-center gap-2">
      <AppButton
        variant="outline"
        size="sm"
        :disabled="!hasPrev"
        aria-label="Page précédente"
        @click="go(page - 1)"
      >
        <ChevronLeft class="w-4 h-4" />
      </AppButton>
      <span class="text-sm text-[var(--color-text)] px-2">
        {{ $t('pagination.pageOf', { current: page, total: totalPages }) }}
      </span>
      <AppButton
        variant="outline"
        size="sm"
        :disabled="!hasNext"
        aria-label="Page suivante"
        @click="go(page + 1)"
      >
        <ChevronRight class="w-4 h-4" />
      </AppButton>
    </div>
  </nav>
</template>
