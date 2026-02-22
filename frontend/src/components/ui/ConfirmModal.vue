<script setup lang="ts">
/**
 * Modal de confirmation stylée (ARCHITECTURE §2).
 * Pas d'alert() navigateur — UX professionnelle pour suppression ou actions critiques.
 */
import { useI18n } from 'vue-i18n'
import { AlertTriangle } from 'lucide-vue-next'
import AppButton from './AppButton.vue'

defineProps<{
  show: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm'): void }>()
const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="show"
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            @click.stop
          >
            <div class="p-6 text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
                <AlertTriangle class="w-6 h-6" />
              </div>
              <h2 id="confirm-title" class="text-lg font-semibold text-[var(--color-text)] mb-2">
                {{ title }}
              </h2>
              <p class="text-sm text-[var(--color-muted)]">
                {{ message }}
              </p>
            </div>
            <div class="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <AppButton variant="ghost" class="flex-1" :disabled="loading" @click="emit('close')">
                {{ t('common.cancel') }}
              </AppButton>
              <AppButton
                :variant="variant ?? 'danger'"
                class="flex-1"
                :disabled="loading"
                @click="emit('confirm')"
              >
                {{ confirmLabel ?? t('common.remove') }}
              </AppButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
