<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { UserPlus } from 'lucide-vue-next'
import { updateProfile } from '../services/auth.service'
import { AppTitle, AppInput, AppButton } from '../components/ui'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const avatarUrl = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  const first = firstName.value.trim()
  const last = lastName.value.trim()
  if (!first || !last) {
    error.value = t('onboarding.validationRequired')
    return
  }
  error.value = ''
  loading.value = true
  try {
    await updateProfile({
      first_name: first,
      last_name: last,
      email: email.value.trim() || undefined,
      avatar_url: avatarUrl.value.trim() || undefined,
    })
    appStore.setUser(appStore.userId, appStore.userRole, true)
    const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('onboarding.errorSave')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="max-w-sm mx-auto px-6 py-12">
    <div class="flex items-center gap-2 mb-6">
      <UserPlus class="w-6 h-6 text-[var(--color-accent)]" />
      <AppTitle :level="2">{{ t('onboarding.title') }}</AppTitle>
    </div>
    <p class="text-[var(--color-muted)] text-sm mb-6">{{ t('onboarding.intro') }}</p>
    <form class="space-y-4" @submit.prevent="submit">
      <AppInput
        v-model="firstName"
        :label="t('onboarding.firstName')"
        :placeholder="t('onboarding.firstNamePlaceholder')"
        required
      />
      <AppInput
        v-model="lastName"
        :label="t('onboarding.lastName')"
        :placeholder="t('onboarding.lastNamePlaceholder')"
        required
      />
      <AppInput
        v-model="email"
        type="email"
        :label="t('onboarding.email')"
        :placeholder="t('onboarding.emailPlaceholder')"
      />
      <AppInput
        v-model="avatarUrl"
        type="url"
        :label="t('onboarding.avatarUrl')"
        :placeholder="t('onboarding.avatarUrlPlaceholder')"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <AppButton type="submit" block :loading="loading">
        {{ loading ? t('onboarding.saving') : t('onboarding.submit') }}
      </AppButton>
    </form>
  </main>
</template>
