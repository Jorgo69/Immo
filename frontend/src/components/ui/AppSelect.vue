<script setup lang="ts">
/**
 * Select réutilisable — label, options { value, label }, erreur.
 * Conforme au design system (tokens Tailwind, pas de HEX en dur).
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    error?: string
    placeholder?: string
    disabled?: boolean
    options: Array<{ value: string; label: string }>
  }>(),
  { disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(e: Event) {
  const el = e.target as HTMLSelectElement
  emit('update:modelValue', el.value)
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-[var(--color-text)]">
      {{ label }}
    </label>
    <div
      class="flex rounded-lg border bg-white dark:bg-gray-800 transition-colors focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:border-transparent"
      :class="error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'"
    >
      <span v-if="$slots.prefix" class="inline-flex items-center pl-3 text-[var(--color-muted)]">
        <slot name="prefix" />
      </span>
      <select
        :value="modelValue"
        :disabled="disabled"
        class="w-full min-w-0 px-3 py-2 rounded-lg text-[var(--color-text)] bg-transparent focus:outline-none disabled:opacity-50"
        :class="$slots.prefix ? 'pl-1' : ''"
        @change="onInput"
      >
      <option value="" disabled>{{ placeholder ?? '—' }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
      <span v-if="$slots.suffix" class="inline-flex items-center pr-3 text-[var(--color-muted)]">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>
