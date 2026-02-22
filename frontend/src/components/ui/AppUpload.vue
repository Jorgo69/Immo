<script setup lang="ts">
/**
 * Upload d'images — unique ou multiple, prévisualisation instantanée (Blob URL).
 * Émet la liste des fichiers (File[]). Gère drag & drop et clic.
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import { Upload, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    /** Nombre max de fichiers (1 = mode single) */
    maxFiles?: number
    /** Types MIME (défaut: images) */
    accept?: string
    disabled?: boolean
    label?: string
    /** Message d'aide sous la zone */
    hint?: string
  }>(),
  { maxFiles: 0, accept: 'image/*', disabled: false }
)

const emit = defineEmits<{ (e: 'update:files', value: File[]): void }>()

const { t } = useI18n()
const files = ref<File[]>([])
const isDragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

/** Prévisualisations Blob URL — on revoke au démontage et à la suppression. */
const previews = ref<Map<string, string>>(new Map())

const canAddMore = computed(() => {
  if (props.maxFiles <= 0) return true
  return files.value.length < props.maxFiles
})

function addFiles(newFiles: FileList | File[]) {
  const list = Array.from(newFiles).filter((f) =>
    f.type.startsWith('image/') || f.type === 'application/pdf',
  )
  if (props.maxFiles > 0) {
    const remaining = props.maxFiles - files.value.length
    list.splice(remaining)
  }
  list.forEach((file) => {
    files.value.push(file)
    previews.value.set(file.name + file.size, URL.createObjectURL(file))
  })
  emit('update:files', [...files.value])
}

function removeFile(index: number) {
  const f = files.value[index]
  if (f) {
    const key = f.name + f.size
    const url = previews.value.get(key)
    if (url) URL.revokeObjectURL(url)
    previews.value.delete(key)
  }
  files.value.splice(index, 1)
  emit('update:files', [...files.value])
}

function getPreviewUrl(file: File): string | undefined {
  return previews.value.get(file.name + file.size)
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) addFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  e.preventDefault()
  if (props.disabled || !canAddMore.value) return
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (props.disabled || !canAddMore.value) return
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function openPicker() {
  if (props.disabled || !canAddMore.value) return
  inputRef.value?.click()
}

onBeforeUnmount(() => {
  previews.value.forEach((url) => URL.revokeObjectURL(url))
  previews.value.clear()
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-sm font-medium text-[var(--color-text)]">
      {{ label }}
    </label>
    <div
      role="button"
      tabindex="0"
      :aria-disabled="disabled || !canAddMore"
      class="relative rounded-xl border-2 border-dashed transition-colors min-h-[140px] flex flex-col items-center justify-center gap-2 p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      :class="[
        isDragging
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
          : 'border-gray-200 dark:border-gray-600 hover:border-[var(--color-accent)]/50',
        (disabled || !canAddMore) && 'opacity-50 cursor-not-allowed',
      ]"
      @click="openPicker"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <input
        ref="inputRef"
        type="file"
        :accept="accept"
        :multiple="maxFiles !== 1"
        class="sr-only"
        @change="onInputChange"
      />
      <Upload class="w-10 h-10 text-[var(--color-muted)]" aria-hidden="true" />
      <span class="text-sm text-[var(--color-muted)] text-center">
        {{ hint ?? t('landlord.dropzoneHint') }}
      </span>
      <span v-if="maxFiles > 0" class="text-xs text-[var(--color-muted)]">
        {{ files.length }} / {{ maxFiles }}
      </span>
    </div>
    <div v-if="files.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <div
        v-for="(file, index) in files"
        :key="file.name + file.size + index"
        class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group"
      >
        <img
          v-if="getPreviewUrl(file)"
          :src="getPreviewUrl(file)"
          :alt="file.name"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-xs p-2"
        >
          {{ file.name }}
        </div>
        <button
          type="button"
          class="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          :aria-label="t('common.remove')"
          @click.stop="removeFile(index)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
