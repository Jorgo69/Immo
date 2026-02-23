<script setup lang="ts">
/**
 * Champ de formulaire — label, erreur, types texte/number/email/date. Slots prefix/suffix pour icônes.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    error?: string
    type?: 'text' | 'number' | 'email' | 'date'
    placeholder?: string
    disabled?: boolean
    min?: number | string
    max?: number | string
    step?: string
  }>(),
  { type: 'text', disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

function onInput(e: Event) {
  const t = e.target as HTMLInputElement
  if (props.type === 'number') {
    emit('update:modelValue', t.value === '' ? '' : Number(t.value))
  } else {
    emit('update:modelValue', t.value)
  }
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-gray-900 dark:text-gray-100">
      {{ label }}
    </label>
    <div
      class="flex rounded-lg border bg-ui-surface dark:bg-ui-surface-dark transition-colors focus-within:ring-2 focus-within:ring-primary-emerald focus-within:border-transparent"
      :class="error ? 'border-danger-red' : 'border-ui-border dark:border-ui-border-dark'"
    >
      <span v-if="$slots.prefix" class="inline-flex items-center pl-3 text-ui-muted">
        <slot name="prefix" />
      </span>
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        class="w-full min-w-0 px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-ui-muted focus:outline-none disabled:opacity-50 bg-transparent"
        :class="[$slots.prefix ? 'pl-1' : '', $slots.suffix ? 'pr-1' : '']"
        @input="onInput"
      />
      <span v-if="$slots.suffix" class="inline-flex items-center pr-3 text-ui-muted">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" class="text-xs text-danger-red">{{ error }}</p>
  </div>
</template>
