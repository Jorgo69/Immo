<script setup lang="ts">
/**
 * Formulaire de candidature à la location — message, date d'entrée souhaitée, envoi.
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppInput } from '../ui'

const props = withDefaults(
  defineProps<{
    unitId: string
    unitName?: string
    show: boolean
    loading?: boolean
  }>(),
  { loading: false }
)

const emit = defineEmits<{
  (e: 'submit', payload: { unit_id: string; message: string; desired_move_in_at?: string }): void
  (e: 'close'): void
}>()

const { t } = useI18n()
const message = ref('')
const desiredMoveInAt = ref('')

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      message.value = ''
      desiredMoveInAt.value = ''
    }
  }
)

function submit() {
  emit('submit', {
    unit_id: props.unitId,
    message: message.value.trim(),
    desired_move_in_at: desiredMoveInAt.value.trim() || undefined,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <p v-if="unitName" class="text-sm text-[var(--color-muted)]">
      {{ t('rental.unit') }} : <strong class="text-[var(--color-text)]">{{ unitName }}</strong>
    </p>
    <AppInput
      v-model="message"
      type="text"
      :label="t('rental.messageLabel')"
      :placeholder="t('rental.messagePlaceholder')"
      class="w-full"
    />
    <AppInput
      v-model="desiredMoveInAt"
      type="date"
      :label="t('rental.desiredMoveInLabel')"
    />
    <div class="flex justify-end gap-3 pt-2">
      <AppButton type="button" variant="ghost" @click="emit('close')">
        {{ t('common.cancel') }}
      </AppButton>
      <AppButton type="submit" variant="primary" :loading="loading">
        {{ t('rental.sendRequest') }}
      </AppButton>
    </div>
  </form>
</template>
