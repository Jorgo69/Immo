<script setup lang="ts">
/**
 * Zone de dépôt pour photos/fichiers — drag & drop ou clic.
 * Émet la liste des fichiers sélectionnés (images par défaut).
 */
import { ref, computed } from 'vue'
import { Upload, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    /** Types MIME acceptés (défaut: images) */
    accept?: string
    /** Nombre max de fichiers (0 = illimité) */
    maxFiles?: number
    /** Désactiver la zone */
    disabled?: boolean
    /** Label au-dessus de la zone */
    label?: string
  }>(),
  { accept: 'image/*', maxFiles: 0, disabled: false }
)

const emit = defineEmits<{
  (e: 'update:files', value: File[]): void
}>()

const files = ref<File[]>([])
const isDragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const canAddMore = computed(() => {
  if (props.maxFiles <= 0) return true
  return files.value.length < props.maxFiles
})

const previews = ref<Map<string, string>>(new Map())

function addFiles(newFiles: FileList | File[]) {
  const list = Array.from(newFiles).filter((f) => f.type.startsWith('image/'))
  if (props.maxFiles > 0) {
    const remaining = props.maxFiles - files.value.length
    list.splice(remaining)
  }
  list.forEach((file) => {
    files.value.push(file)
    const reader = new FileReader()
    reader.onload = () => {
      previews.value.set(file.name, reader.result as string)
    }
    reader.readAsDataURL(file)
  })
  emit('update:files', [...files.value])
}

function removeFile(index: number) {
  const f = files.value[index]
  files.value.splice(index, 1)
  previews.value.delete(f.name)
  emit('update:files', [...files.value])
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
        {{ $t('landlord.dropzoneHint') }}
      </span>
      <span v-if="maxFiles > 0" class="text-xs text-[var(--color-muted)]">
        {{ files.length }} / {{ maxFiles }}
      </span>
    </div>
    <div v-if="files.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <div
        v-for="(file, index) in files"
        :key="file.name + index"
        class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group"
      >
        <img
          v-if="previews.get(file.name)"
          :src="previews.get(file.name)"
          :alt="file.name"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-xs"
        >
          {{ file.name }}
        </div>
        <button
          type="button"
          class="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          :aria-label="$t('common.remove')"
          @click.stop="removeFile(index)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
