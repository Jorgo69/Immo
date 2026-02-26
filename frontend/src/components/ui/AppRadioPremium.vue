<script setup lang="ts">
defineOptions({ inheritAttrs: false })
/**
 * Radio personnalisé Premium.
 * Design Soft Tech : cercles concentriques, émeraude, focus diffus.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    value: string | number
    label?: string
    error?: string
    disabled?: boolean
    name?: string
  }>(),
  { disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number | boolean] }>()

function select() {
  if (props.disabled) return
  emit('update:modelValue', props.value)
}

const isChecked = computed(() => props.modelValue === props.value)
</script>

<template>
  <div class="flex flex-col gap-1">
    <label 
      class="flex cursor-pointer items-center gap-3 select-none group"
      @click="select"
    >
      <input
        v-bind="$attrs"
        type="radio"
        class="sr-only"
        :name="name"
        :value="value"
        :checked="isChecked"
        :disabled="disabled"
      />
      <div 
        class="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 group-hover:shadow-glow-emerald/20"
        :class="[
          isChecked 
            ? 'border-primary-emerald shadow-glow-emerald' 
            : 'bg-white/50 border-ui-border dark:bg-brand-dark/50 dark:border-ui-border-dark',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        ]"
      >
        <div 
          class="h-2.5 w-2.5 rounded-full bg-primary-emerald transition-all duration-300 transform" 
          :class="isChecked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
        />
        
        <!-- Focus Ring Effect (internal) -->
        <div 
          class="absolute -inset-2 rounded-full ring-4 ring-primary-emerald/10 opacity-0 transition-opacity group-focus-within:opacity-100" 
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

<script lang="ts">
import { computed } from 'vue'
export default {
  name: 'AppRadioPremium'
}
</script>
