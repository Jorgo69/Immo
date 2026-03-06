<script setup lang="ts">
/**
 * AppDataFilters — Barre de filtres configurable et déclarative.
 * 
 * Usage :
 * <AppDataFilters
 *   :filters="[
 *     { type: 'search', key: 'search', placeholder: t('...'), icon: Search },
 *     { type: 'select', key: 'role', label: t('...'), options: [...] },
 *     { type: 'sort', key: 'sortBy', options: [...] },
 *     { type: 'toggle', key: 'order', labelOn: t('...'), labelOff: t('...') },
 *   ]"
 *   v-model="filters"
 *   @change="onFilterChange"
 * />
 */
import { ref, type Component } from 'vue'
import { Search as SearchIcon, Filter } from 'lucide-vue-next'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDef {
  /** Type de filtre */
  type: 'search' | 'select' | 'number' | 'sort' | 'toggle'
  /** Clé dans l'objet v-model */
  key: string
  /** Label affiché (i18n) */
  label?: string
  /** Placeholder (i18n) */
  placeholder?: string
  /** Icône Lucide (composant) */
  icon?: Component
  /** Options pour select/sort */
  options?: FilterOption[]
  /** Min pour number */
  min?: number
  /** Max pour number */
  max?: number
  /** Labels pour toggle */
  labelOn?: string
  labelOff?: string
  /** Debounce en ms (défaut : 300 pour search, 0 pour les autres) */
  debounce?: number
  /** Largeur CSS optionnelle (ex: 'w-36') */
  width?: string
}

const props = defineProps<{
  filters: FilterDef[]
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  'change': [value: Record<string, any>]
}>()

// Debounce timers
const debounceTimers = ref<Record<string, ReturnType<typeof setTimeout>>>({})

function updateFilter(key: string, value: any, debounceMs?: number) {
  const def = props.filters.find(f => f.key === key)
  const delay = debounceMs ?? (def?.type === 'search' ? (def.debounce ?? 300) : 0)

  if (delay > 0) {
    if (debounceTimers.value[key]) clearTimeout(debounceTimers.value[key])
    debounceTimers.value[key] = setTimeout(() => {
      const updated = { ...props.modelValue, [key]: value }
      emit('update:modelValue', updated)
      emit('change', updated)
    }, delay)
  } else {
    const updated = { ...props.modelValue, [key]: value }
    emit('update:modelValue', updated)
    emit('change', updated)
  }
}

function toggleValue(key: string) {
  const current = props.modelValue[key]
  // Gère les toggles string (ex: 'DESC' ↔ 'ASC') ou boolean
  if (typeof current === 'string') {
    updateFilter(key, current === 'DESC' ? 'ASC' : 'DESC')
  } else {
    updateFilter(key, !current)
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-2xl bg-ui-background/50 p-3 border border-ui-border/50 dark:bg-brand-dark/50 dark:border-ui-border-dark/50">
    <template v-for="def in filters" :key="def.key">
      <!-- Search -->
      <div v-if="def.type === 'search'" class="relative flex-1 min-w-[200px]">
        <component
          :is="def.icon || SearchIcon"
          class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-muted"
        />
        <input
          type="text"
          :value="modelValue[def.key] ?? ''"
          :placeholder="def.placeholder"
          class="w-full rounded-xl border border-ui-border bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary-emerald focus:ring-2 focus:ring-primary-emerald/20 dark:bg-brand-dark dark:border-ui-border-dark dark:text-white"
          @input="updateFilter(def.key, ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Select -->
      <div v-else-if="def.type === 'select'" class="flex items-center gap-1.5">
        <component
          v-if="def.icon"
          :is="def.icon"
          class="h-4 w-4 text-ui-muted shrink-0"
        />
        <select
          :value="modelValue[def.key] ?? ''"
          :class="[
            'rounded-xl border border-ui-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary-emerald cursor-pointer dark:bg-brand-dark dark:border-ui-border-dark dark:text-white',
            def.width ?? ''
          ]"
          @change="updateFilter(def.key, ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in def.options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Sort (select) -->
      <div v-else-if="def.type === 'sort'" class="flex items-center gap-1.5">
        <component
          v-if="def.icon"
          :is="def.icon"
          class="h-4 w-4 text-ui-muted shrink-0"
        />
        <select
          :value="modelValue[def.key] ?? ''"
          class="rounded-xl border border-ui-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary-emerald cursor-pointer dark:bg-brand-dark dark:border-ui-border-dark dark:text-white"
          @change="updateFilter(def.key, ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in def.options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Number -->
      <div v-else-if="def.type === 'number'" class="flex items-center gap-1.5">
        <component
          v-if="def.icon"
          :is="def.icon"
          class="h-4 w-4 text-ui-muted shrink-0"
        />
        <input
          type="number"
          :value="modelValue[def.key] ?? ''"
          :placeholder="def.placeholder"
          :min="def.min"
          :max="def.max"
          :class="[
            'rounded-xl border border-ui-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary-emerald dark:bg-brand-dark dark:border-ui-border-dark dark:text-white',
            def.width ?? 'w-28'
          ]"
          @input="updateFilter(def.key, ($event.target as HTMLInputElement).value, def.debounce ?? 300)"
        />
      </div>

      <!-- Toggle -->
      <button
        v-else-if="def.type === 'toggle'"
        class="flex items-center gap-1 rounded-xl border border-ui-border bg-white px-3 py-2 text-sm font-medium transition-all hover:bg-ui-background dark:bg-brand-dark dark:border-ui-border-dark dark:text-white"
        @click="toggleValue(def.key)"
      >
        <component
          v-if="def.icon"
          :is="def.icon"
          class="h-3.5 w-3.5"
        />
        <Filter v-else class="h-3.5 w-3.5" />
        {{ modelValue[def.key] === 'DESC' || modelValue[def.key] === true ? (def.labelOn ?? '') : (def.labelOff ?? '') }}
      </button>
    </template>
  </div>
</template>
