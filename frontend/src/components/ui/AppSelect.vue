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
    <select
      :value="modelValue"
      :disabled="disabled"
      class="w-full px-3 py-2 rounded-lg border text-[var(--color-text)] bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:opacity-50"
      :class="error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'"
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
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>
