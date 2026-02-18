<script setup lang="ts">
/**
 * Champ de formulaire — label optionnel, erreur, types texte/number/email.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    error?: string
    type?: 'text' | 'number' | 'email'
    placeholder?: string
    disabled?: boolean
    min?: number
    max?: number
    step?: string
  }>(),
  { type: 'text', disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

function onInput(e: Event) {
  const t = e.target as HTMLInputElement
  emit(
    'update:modelValue',
    props.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value
  )
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-[var(--color-text)]">
      {{ label }}
    </label>
    <input
      :value="modelValue"
      :type="props.type"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      class="w-full px-3 py-2 rounded-lg border text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:opacity-50"
      :class="error ? 'border-red-500' : 'border-gray-200'"
      @input="onInput"
    />
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>
