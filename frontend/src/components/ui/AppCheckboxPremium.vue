<script setup lang="ts">
defineOptions({ inheritAttrs: false })
import { Check } from 'lucide-vue-next'
/**
 * Checkbox personnalisée Premium.
 * Design Soft Tech : arrondis 1/2, fond émeraude au check, focus diffus.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    label?: string
    error?: string
    disabled?: boolean
  }>(),
  { modelValue: false, disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <label 
      class="flex cursor-pointer items-center gap-3 select-none group"
      @click="toggle"
    >
      <input
        v-bind="$attrs"
        type="checkbox"
        class="sr-only"
        :checked="modelValue"
        :disabled="disabled"
      />
      <div 
        class="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300 group-hover:shadow-glow-emerald/20"
        :class="[
          modelValue 
            ? 'bg-primary-emerald border-primary-emerald shadow-glow-emerald' 
            : 'bg-white/50 border-ui-border dark:bg-brand-dark/50 dark:border-ui-border-dark',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        ]"
      >
        <Check 
          class="h-4 w-4 text-white transition-opacity duration-300" 
          :class="modelValue ? 'opacity-100 scale-100' : 'opacity-0 scale-50'"
        />
        
        <!-- Focus Ring Effect (internal) -->
        <div 
          class="absolute -inset-2 rounded-xl ring-4 ring-primary-emerald/10 opacity-0 transition-opacity group-focus-within:opacity-100" 
        />
      </div>
      
      <span v-if="label" class="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-emerald transition-colors">
        {{ label }}
      </span>
    </label>
    <p v-if="error" class="ml-9 text-xs font-bold text-danger-red transition-all animate-in fade-in slide-in-from-top-1">
      {{ error }}
    </p>
  </div>
</template>
