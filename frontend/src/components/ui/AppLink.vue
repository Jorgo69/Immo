<script setup lang="ts">
/**
 * Lien réutilisable — interne (RouterLink) ou externe (a).
 * Usage: <AppLink to="/admin">Espace pro</AppLink> ou <AppLink :to="{ name: 'admin-users' }">…
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to?: string | RouteLocationRaw
    href?: string
    variant?: 'nav' | 'default' | 'accent'
    class?: string
  }>(),
  { variant: 'default' }
)

const isInternal = computed(() => (props.to != null && props.to !== '') && !props.href)
const linkClass = computed(() => [
  'inline-flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-accent)] rounded',
  props.variant === 'nav' && 'text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]',
  props.variant === 'default' && 'text-[var(--color-text)] hover:underline',
  props.variant === 'accent' && 'text-sm font-medium text-[var(--color-accent)] hover:opacity-80',
  props.class,
])
</script>

<template>
  <RouterLink v-if="isInternal" :to="to as RouteLocationRaw" :class="linkClass">
    <slot />
  </RouterLink>
  <a v-else :href="href" :class="linkClass" target="_blank" rel="noopener noreferrer">
    <slot />
  </a>
</template>
