<script setup lang="ts">
/**
 * Bloc pour une image uploadée : preview, toggle "Image principale", rang, description i18n.
 * @props item - { previewUrl, rank, is_primary, description }
 * @emits update:item - quand l'utilisateur modifie un champ
 * @emits remove - demande de suppression de l'image
 */
import { useI18n } from 'vue-i18n'
import { Star, Hash, AlignLeft, X } from 'lucide-vue-next'
import { AppInput } from '../ui'

const props = defineProps<{
  item: {
    previewUrl: string
    rank: number
    is_primary: boolean
    description: Record<string, string>
  }
  index: number
  canRemove?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:item', payload: Partial<typeof props.item>): void
  (e: 'remove'): void
}>()

const { t } = useI18n()

function setPrimary(v: boolean) {
  emit('update:item', { is_primary: v })
}

function setRank(v: string) {
  const n = parseInt(v, 10)
  if (!Number.isNaN(n) && n >= 1) emit('update:item', { rank: n })
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
    <div class="flex gap-4 p-3">
      <div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img
          v-if="item.previewUrl"
          :src="item.previewUrl"
          :alt="'Image ' + (index + 1)"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="flex-1 min-w-0 space-y-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="item.is_primary"
            class="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
            @change="setPrimary(($event.target as HTMLInputElement).checked)"
          />
          <Star class="w-4 h-4 text-[var(--color-muted)]" />
          <span class="text-sm font-medium text-[var(--color-text)]">{{ t('landlord.imagePrimary') }}</span>
        </label>
        <div class="flex items-center gap-2">
          <Hash class="w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="number"
            :value="item.rank"
            min="1"
            class="w-16 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-sm text-[var(--color-text)] bg-white dark:bg-gray-800"
            @input="setRank(($event.target as HTMLInputElement).value)"
          />
          <span class="text-xs text-[var(--color-muted)]">{{ t('landlord.imageRank') }}</span>
        </div>
        <p class="text-xs font-medium text-[var(--color-muted)]">{{ t('landlord.imageDescription') }}</p>
        <div class="grid grid-cols-2 gap-2">
          <AppInput
            :model-value="item.description?.fr ?? ''"
            :label="t('landlord.langFr')"
            class="text-sm"
            @update:model-value="(v: string) => emit('update:item', { description: { ...item.description, fr: v } })"
          />
          <AppInput
            :model-value="item.description?.en ?? ''"
            :label="t('landlord.langEn')"
            class="text-sm"
            @update:model-value="(v: string) => emit('update:item', { description: { ...item.description, en: v } })"
          />
        </div>
      </div>
      <button
        v-if="canRemove"
        type="button"
        class="p-2 rounded-lg text-[var(--color-muted)] hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0"
        :aria-label="t('common.remove')"
        @click="emit('remove')"
      >
        <X class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
