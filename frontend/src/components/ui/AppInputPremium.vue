<script setup lang="ts">
defineOptions({ inheritAttrs: false })
/**
 * Champ de formulaire Premium — label, erreur, types texte/number/email/date.
 * Design Soft Tech : arrondis 2xl, ombre diffuse au focus, bordures fines.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    error?: string
    type?: 'text' | 'number' | 'email' | 'date' | 'password'
    placeholder?: string
    disabled?: boolean
    min?: number | string
    max?: number | string
    step?: string
    inputClass?: string
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
  <div class="flex flex-col gap-2">
    <label v-if="label" class="ml-1 text-xs font-bold uppercase tracking-widest text-ui-muted dark:text-gray-400">
      {{ label }}
    </label>
    <div
      class="group relative flex rounded-2xl border bg-white/50 backdrop-blur-sm transition-all duration-300 focus-within:ring-4 focus-within:ring-primary-emerald/10 dark:bg-brand-dark/50"
      :class="error 
        ? 'border-danger-red shadow-glow-red/10' 
        : 'border-ui-border dark:border-ui-border-dark focus-within:border-primary-emerald shadow-soft-sm hover:border-ui-border-hover dark:hover:border-ui-border-dark-hover'"
    >
      <span v-if="$slots.prefix" class="inline-flex items-center pl-4 text-ui-muted transition-colors group-focus-within:text-primary-emerald">
        <slot name="prefix" />
      </span>
      <input
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        class="w-full min-w-0 px-4 py-3.5 rounded-2xl text-base font-medium text-gray-900 dark:text-gray-100 placeholder:text-ui-muted placeholder:font-normal focus:outline-none disabled:opacity-50 bg-transparent"
        :class="[$slots.prefix ? 'pl-2' : '', $slots.suffix ? 'pr-2' : '', inputClass]"
        @input="onInput"
      />
      <span v-if="$slots.suffix" class="inline-flex items-center pr-4 text-ui-muted transition-colors group-focus-within:text-primary-emerald">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" class="ml-1 text-xs font-bold text-danger-red transition-all animate-in fade-in slide-in-from-top-1">
      {{ error }}
    </p>
  </div>
</template>
