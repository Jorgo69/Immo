<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { Smartphone } from 'lucide-vue-next'
import { requestOtp, verifyOtp } from '../services/auth.service'
import { AppTitle, AppInput, AppButton } from '../components/ui'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const phone = ref('')
const code = ref('')
const step = ref<'phone' | 'code'>('phone')
const loading = ref(false)
const error = ref('')

async function requestCode() {
  if (!phone.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    await requestOtp(phone.value.trim())
    step.value = 'code'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur envoi code'
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  if (!code.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    const data = await verifyOtp({
      phone_number: phone.value.trim(),
      code: code.value.trim(),
    })
    appStore.setToken(data.token)
    appStore.setUser(data.user.id, data.user.role)
    const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="max-w-sm mx-auto px-6 py-12">
    <div class="flex items-center gap-2 mb-6">
      <Smartphone class="w-6 h-6 text-[var(--color-accent)]" />
      <AppTitle :level="2">{{ t('nav.auth') }}</AppTitle>
    </div>
    <form class="space-y-4" @submit.prevent="step === 'phone' ? requestCode() : verifyCode()">
      <AppInput
        v-if="step === 'phone'"
        v-model="phone"
        type="text"
        :label="t('auth.phone')"
        placeholder="+229 90 12 34 56"
      />
      <AppInput
        v-else
        v-model="code"
        type="text"
        :label="t('auth.code')"
        placeholder="123456"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <AppButton type="submit" block :loading="loading">
        {{ step === 'phone' ? t('auth.requestCode') : t('auth.verify') }}
      </AppButton>
    </form>
  </main>
</template>
