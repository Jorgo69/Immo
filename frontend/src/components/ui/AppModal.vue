<script setup lang="ts">
/**
 * Modal générique — titre, slot par défaut pour le contenu, bouton fermer.
 */
import { X } from 'lucide-vue-next'
import AppButton from './AppButton.vue'

defineProps<{
  show: boolean
  title: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()
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
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'modal-title-' + title"
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
            class="bg-ui-surface dark:bg-gray-800 rounded-2xl shadow-soft-lg w-full max-w-modal-lg max-h-screen-90 flex flex-col border border-ui-border dark:border-gray-700"
            @click.stop
          >
            <header class="flex items-center justify-between p-4 border-b border-ui-border dark:border-gray-700 shrink-0">
              <h2 :id="'modal-title-' + title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ title }}
              </h2>
              <AppButton type="button" variant="ghost" size="sm" :aria-label="$t('common.cancel')" @click="emit('close')">
                <X class="w-5 h-5" />
              </AppButton>
            </header>
            <div class="flex-1 overflow-y-auto p-4">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
