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
    size?: 'sm' | 'md' | 'lg' | 'none'
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
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-emerald disabled:opacity-50 disabled:cursor-not-allowed',
      block ? 'w-full' : '',
      size === 'sm' && 'px-3 py-1.5 text-xs',
      size === 'md' && 'px-4 py-2 text-sm',
      size === 'lg' && 'px-5 py-2.5 text-base',
      variant === 'primary' && 'bg-primary-emerald text-white hover:opacity-90',
      variant === 'secondary' && 'bg-ui-border text-gray-900 hover:bg-ui-border-hover dark:bg-ui-border-dark dark:text-gray-100 dark:hover:opacity-90',
      variant === 'outline' && 'border border-ui-border bg-ui-surface text-gray-900 hover:border-primary-emerald dark:border-ui-border-dark dark:bg-ui-surface-dark dark:text-gray-100 dark:hover:border-primary-emerald',
      variant === 'danger' && 'bg-danger-red text-white hover:opacity-90',
      variant === 'ghost' && 'text-ui-muted hover:bg-ui-background hover:text-gray-900 dark:hover:bg-ui-border-dark dark:hover:text-gray-100',
    ]"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <slot />
  </button>
</template>
