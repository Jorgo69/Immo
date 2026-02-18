<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import { User } from 'lucide-vue-next'
import { getMyProfile, updateMyProfile } from '../services/profile.service'
import { AppTitle, AppCard, AppButton, AppInput } from '../components/ui'

const { t } = useI18n()
const profile = ref<{
  id: string
  user_id: string
  full_name: string | null
  id_card: string | null
  kyc_status: string
} | null>(null)
const loading = ref(true)
const saving = ref(false)
const fullName = ref('')
const idCard = ref('')

async function fetchProfile() {
  loading.value = true
  try {
    const data = await getMyProfile()
    if (data) {
      profile.value = data
      fullName.value = profile.value?.full_name ?? ''
      idCard.value = profile.value?.id_card ?? ''
    } else {
      profile.value = null
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    profile.value = await updateMyProfile({
      full_name: fullName.value || undefined,
      id_card: idCard.value || undefined,
    })
  } finally {
    saving.value = false
  }
}

onMounted(fetchProfile)
</script>

<template>
  <main class="max-w-layout mx-auto px-6 md:px-8 py-8">
    <AppTitle :level="2" class="mb-6 flex items-center gap-2">
      <User class="w-6 h-6 text-[var(--color-accent)]" />
      {{ t('profile.title') }}
    </AppTitle>

    <p v-if="loading" class="text-[var(--color-muted)]">{{ t('profile.loading') }}</p>

    <AppCard v-else>
      <form class="space-y-4" @submit.prevent="save">
        <AppInput
          v-model="fullName"
          :label="t('profile.fullName')"
          :placeholder="t('profile.fullNamePlaceholder')"
        />
        <AppInput
          v-model="idCard"
          :label="t('profile.idCard')"
          :placeholder="t('profile.idCardPlaceholder')"
        />
        <p v-if="profile" class="text-sm text-[var(--color-muted)]">
          {{ t('profile.kycStatus') }}: <strong>{{ profile.kyc_status }}</strong>
        </p>
        <AppButton type="submit" :loading="saving">
          {{ saving ? t('profile.saving') : t('profile.save') }}
        </AppButton>
      </form>
    </AppCard>
  </main>
</template>
