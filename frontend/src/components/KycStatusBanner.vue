<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ShieldAlert, Clock, ChevronRight } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const status = computed(() => appStore.kycStatus)
const isVerified = computed(() => appStore.isVerified)
const rejectionReason = computed(() => appStore.currentUser?.profile?.kyc_rejection_reason)

const shouldShow = computed(() => {
  // On ne montre rien si déjà vérifié ou si admin
  if (isVerified.value || appStore.userRole === 'admin') return false
  return status.value === 'pending' || status.value === 'rejected'
})

function goToKyc() {
  router.push({ name: 'profile-edit' }) // Ou une page dédiée KYC si elle existe
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform -translate-y-4 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-4 opacity-0"
  >
    <div v-if="shouldShow" class="mb-8 overflow-hidden rounded-3xl border shadow-glass" :class="status === 'rejected' ? 'bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-900/30' : 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30'">
      <div class="flex items-center gap-4 p-5 sm:p-6">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" :class="status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'">
          <ShieldAlert v-if="status === 'rejected'" class="h-6 w-6" />
          <Clock v-else class="h-6 w-6" />
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-bold text-[var(--color-text)]">
            {{ status === 'rejected' ? t('kycBanner.rejectedTitle') : t('kycBanner.pendingTitle') }}
          </h3>
          <p class="mt-1 text-sm text-ui-muted line-clamp-2">
            <template v-if="status === 'rejected'">
              {{ t('kycBanner.rejectedDesc', { reason: rejectionReason || '—' }) }}
            </template>
            <template v-else>
              {{ t('kycBanner.pendingDesc') }}
            </template>
          </p>
        </div>

        <button 
          @click="goToKyc"
          class="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-all hover:scale-105 active:scale-95"
          :class="status === 'rejected' ? 'bg-red-600 text-white shadow-glow-red' : 'bg-amber-500 text-white shadow-glow-amber'"
        >
          {{ t('kycBanner.completeCta') }}
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.shadow-glass {
  backdrop-filter: blur(12px);
}
.shadow-glow-red {
  box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.39);
}
.shadow-glow-amber {
  box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.39);
}
</style>
