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
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-overlay"
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
            class="bg-ui-surface dark:bg-ui-surface-dark rounded-2xl shadow-soft-lg w-full max-w-modal overflow-hidden border border-ui-border dark:border-ui-border-dark"
            @click.stop
          >
            <div class="p-6 text-center">
              <div class="mx-auto flex w-12 h-12 items-center justify-center rounded-full bg-danger-red/10 text-danger-red mb-4">
                <AlertTriangle :size="24" class="shrink-0 text-danger-red" />
              </div>
              <h2 id="confirm-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ title }}
              </h2>
              <p class="text-sm text-ui-muted">
                {{ message }}
              </p>
            </div>
            <div class="flex gap-3 p-4 border-t border-ui-border dark:border-ui-border-dark bg-ui-background/50 dark:bg-ui-surface-dark/50">
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
