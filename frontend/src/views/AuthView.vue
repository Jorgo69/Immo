<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { Smartphone, Mail, MessageCircle } from 'lucide-vue-next'
import { requestOtp, verifyOtp, type AuthChannel } from '../services/auth.service'
import { AppTitle, AppInput, AppButton } from '../components/ui'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const phone = ref('')
const email = ref('')
const code = ref('')
const step = ref<'phone' | 'code'>('phone')
const loading = ref(false)
const error = ref('')

const availableChannels = ref<AuthChannel[]>([])
const whatsappLink = ref<string | null>(null)
const sentChannels = ref<AuthChannel[]>([])

async function requestCode() {
  if (!phone.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    const data = await requestOtp({
      phone_number: phone.value.trim(),
      email: email.value.trim() || undefined,
    })
    availableChannels.value = data.available_channels ?? []
    whatsappLink.value = data.whatsapp_link ?? null
    sentChannels.value = data.sent_channels ?? []
    step.value = 'code'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur envoi code'
  } finally {
    loading.value = false
  }
}

function openWhatsApp() {
  if (whatsappLink.value) window.open(whatsappLink.value, '_blank', 'noopener,noreferrer')
}

async function verifyCode() {
  if (!code.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    const data = await verifyOtp({
      phone_number: phone.value.trim(),
      code: code.value.trim(),
      email: email.value.trim() || undefined,
    })
    appStore.setToken(data.token)
    appStore.setUser(data.user.id, data.user.role, data.is_profile_complete)
    const redirect =
      data.is_profile_complete
        ? ((router.currentRoute.value.query.redirect as string) || '/dashboard')
        : '/onboarding'
    router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    loading.value = false
  }
}

const sentByEmail = () => sentChannels.value.includes('email')
const hasWhatsApp = () => Boolean(whatsappLink.value)
</script>

<template>
  <main class="max-w-sm mx-auto px-6 py-12">
    <div class="flex items-center gap-2 mb-6">
      <Smartphone class="w-6 h-6 text-[var(--color-accent)]" />
      <AppTitle :level="2">{{ t('nav.auth') }}</AppTitle>
    </div>

    <form
      v-if="step === 'phone'"
      class="space-y-4"
      @submit.prevent="requestCode()"
    >
      <AppInput
        v-model="phone"
        type="text"
        :label="t('auth.phone')"
        placeholder="+229 90 12 34 56"
      />
      <AppInput
        v-model="email"
        type="email"
        :label="t('auth.email')"
        :placeholder="t('auth.emailPlaceholder')"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <AppButton type="submit" block :loading="loading">
        {{ t('auth.requestCode') }}
      </AppButton>
    </form>

    <template v-else>
      <p class="text-sm text-[var(--color-muted)] mb-4">
        {{ t('auth.whereToReceive') }}
      </p>
      <div class="space-y-3 mb-6">
        <p
          v-if="sentByEmail()"
          class="flex items-center gap-2 text-sm text-[var(--color-accent)]"
        >
          <Mail class="w-4 h-4 shrink-0" />
          {{ t('auth.sentByEmail') }}
        </p>
        <AppButton
          v-if="hasWhatsApp()"
          type="button"
          variant="outline"
          block
          @click="openWhatsApp"
        >
          <MessageCircle class="w-4 h-4 mr-2" />
          {{ t('auth.openWhatsApp') }}
        </AppButton>
      </div>
      <form class="space-y-4" @submit.prevent="verifyCode()">
        <AppInput
          v-model="code"
          type="text"
          :label="t('auth.code')"
          :placeholder="t('auth.enterCode')"
          maxlength="6"
        />
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <AppButton type="submit" block :loading="loading">
          {{ t('auth.verify') }}
        </AppButton>
      </form>
    </template>
  </main>
</template>
