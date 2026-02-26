<script setup lang="ts">
defineOptions({ inheritAttrs: false })
import { ChevronDown } from 'lucide-vue-next'
/**
 * Select réutilisable Premium — label, options { value, label }, erreur.
 * Design Soft Tech : arrondis 2xl, glassmorphism, focus diffus.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    error?: string
    placeholder?: string
    disabled?: boolean
    options: Array<{ value: string | number; label: string }>
  }>(),
  { disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

function onChange(e: Event) {
  const el = e.target as HTMLSelectElement
  emit('update:modelValue', el.value)
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
      
      <div class="relative flex-1">
        <select
          v-bind="$attrs"
          :value="modelValue"
          :disabled="disabled"
          class="w-full appearance-none px-4 py-3.5 rounded-2xl text-base font-medium text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none disabled:opacity-50"
          :class="$slots.prefix ? 'pl-2' : ''"
          @change="onChange"
        >
          <option value="" disabled selected>{{ placeholder ?? 'Choisir...' }}</option>
          <option
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            class="bg-white dark:bg-brand-dark"
          >
            {{ opt.label }}
          </option>
        </select>
        <!-- Custom Arrow -->
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-ui-muted group-focus-within:text-primary-emerald">
          <ChevronDown class="h-5 w-5 transition-transform duration-300 group-focus-within:rotate-180" />
        </div>
      </div>

      <span v-if="$slots.suffix" class="inline-flex items-center pr-4 text-ui-muted transition-colors group-focus-within:text-primary-emerald">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" class="ml-1 text-xs font-bold text-danger-red transition-all animate-in fade-in slide-in-from-top-1">
      {{ error }}
    </p>
  </div>
</template>
