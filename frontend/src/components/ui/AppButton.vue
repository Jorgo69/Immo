<script setup lang="ts">
/**
 * Bouton réutilisable — variantes: primary, secondary, outline, danger, ghost.
 * Usage: <AppButton variant="primary">Texte</AppButton>
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
    block?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { variant: 'primary', type: 'button', disabled: false, loading: false, block: false, size: 'md' }
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed',
      block ? 'w-full' : '',
      size === 'sm' && 'px-3 py-1.5 text-xs',
      size === 'md' && 'px-4 py-2 text-sm',
      size === 'lg' && 'px-5 py-2.5 text-base',
      variant === 'primary' && 'bg-[var(--color-accent)] text-white hover:opacity-90',
      variant === 'secondary' && 'bg-gray-100 text-[var(--color-text)] hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
      variant === 'outline' && 'border border-gray-200 bg-white text-[var(--color-text)] hover:border-[var(--color-accent)] dark:border-gray-600 dark:bg-gray-800 dark:hover:border-[var(--color-accent)]',
      variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
      variant === 'ghost' && 'text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] dark:hover:bg-gray-800',
    ]"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <slot />
  </button>
</template>
