<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import gsap from 'gsap'
import { useAppStore } from '../stores/app'
import { Smartphone, Mail, MessageCircle, ChevronDown } from 'lucide-vue-next'
import { requestOtp, verifyOtp, type AuthChannel } from '../services/auth.service'
import { AppTitle, AppInput, AppButton } from '../components/ui'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const countries = [
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'NG', name: 'Nigéria', dial: '+234', flag: '🇳🇬' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
] as const

type CountryCode = (typeof countries)[number]['code']

const selectedCountryCode = ref<CountryCode>('BJ')
const countryMenuOpen = ref(false)
const phoneLocal = ref('')
const email = ref('')
const code = ref('')
const step = ref<'phone' | 'code'>('phone')
const loading = ref(false)

const availableChannels = ref<AuthChannel[]>([])
const whatsappLink = ref<string | null>(null)
const sentChannels = ref<AuthChannel[]>([])

const selectedCountry = computed(
  () => countries.find((c) => c.code === selectedCountryCode.value) ?? countries[0],
)

const e164Phone = computed(() => {
  const digits = phoneLocal.value.replace(/\D/g, '')
  if (!digits) return ''
  return selectedCountry.value.dial + digits
})

const hasEmailChannel = computed(() => availableChannels.value.includes('email'))
const hasSmsChannel = computed(() => availableChannels.value.includes('sms'))
const hasWhatsAppChannel = computed(() => Boolean(whatsappLink.value))

async function requestCode() {
  if (!phoneLocal.value.trim()) {
    toast.error(t('auth.phoneRequired'))
    return
  }
  const phone = e164Phone.value
  if (!phone) {
    toast.error(t('auth.phoneRequired'))
    return
  }
  loading.value = true
  try {
    const data = await requestOtp({
      phone_number: phone,
      email: email.value.trim() || undefined,
    })
    availableChannels.value = data.available_channels ?? []
    whatsappLink.value = data.whatsapp_link ?? null
    sentChannels.value = data.sent_channels ?? []
    toast.success(t('auth.codeSent'))
    step.value = 'code'
  } catch (e) {
    const message = e instanceof Error ? e.message : t('auth.errorSend')
    toast.error(message)
  } finally {
    loading.value = false
  }
}

function openWhatsApp() {
  if (whatsappLink.value) window.open(whatsappLink.value, '_blank', 'noopener,noreferrer')
}

async function verifyCode() {
  if (!code.value.trim()) {
    toast.error(t('auth.codeRequired'))
    return
  }
  const phone = e164Phone.value
  if (!phone) {
    toast.error(t('auth.phoneRequired'))
    return
  }
  loading.value = true
  try {
    const data = await verifyOtp({
      phone_number: phone,
      code: code.value.trim(),
      email: email.value.trim() || undefined,
    })
    appStore.setToken(data.token)
    appStore.setUser(data.user.id, data.user.role, data.is_profile_complete)
    toast.success(t('auth.loginSuccess'))
    const redirect =
      data.is_profile_complete
        ? ((router.currentRoute.value.query.redirect as string) || '/dashboard')
        : '/onboarding'
    router.push(redirect)
  } catch (e) {
    const message = e instanceof Error ? e.message : t('auth.errorVerify')
    toast.error(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const tl = gsap.timeline()
  tl.from('.auth-hero', { opacity: 0, y: -10, duration: 0.3, ease: 'power2.out' }).from(
    '.auth-card',
    { opacity: 0, y: 10, duration: 0.3, ease: 'power2.out' },
    '-=0.15',
  )
})
</script>

<template>
  <main class="min-h-[100dvh] bg-[#F9FAFB] px-4 py-10 dark:bg-gray-950">
    <div class="mx-auto w-full max-w-sm space-y-8">
      <!-- En-tête sobre -->
      <section class="auth-hero space-y-3 text-center">
        <div
          class="mx-auto inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <Smartphone class="h-5 w-5 text-[var(--color-accent)]" />
        </div>
        <AppTitle :level="2">
          {{ t('nav.auth') }}
        </AppTitle>
        <p class="text-sm text-[var(--color-muted)]">
          {{ t('auth.subtitle') }}
        </p>
      </section>

      <!-- Carte Auth -->
      <section
        class="auth-card rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <form
          v-if="step === 'phone'"
          class="space-y-4"
          @submit.prevent="requestCode()"
        >
          <!-- Phone input style WhatsApp : drapeau + indicatif dans le champ -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-[var(--color-text)]">
              {{ t('auth.phone') }}
            </label>
            <div
              class="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-accent)] dark:border-gray-700 dark:bg-gray-900"
            >
              <div class="relative">
                <button
                  type="button"
                  class="flex items-center gap-1 rounded-xl px-2 py-1 text-sm text-[var(--color-text)] hover:bg-gray-50 dark:hover:bg-gray-800"
                  @click.stop="countryMenuOpen = !countryMenuOpen"
                >
                  <span class="text-lg">{{ selectedCountry.flag }}</span>
                  <span class="text-xs text-[var(--color-muted)]">
                    {{ selectedCountry.dial }}
                  </span>
                  <ChevronDown class="h-3 w-3 text-[var(--color-muted)]" />
                </button>
                <div
                  v-if="countryMenuOpen"
                  class="absolute left-0 top-full z-20 mt-1 w-40 rounded-2xl border border-gray-200 bg-white py-1 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900"
                >
                  <button
                    v-for="c in countries"
                    :key="c.code"
                    type="button"
                    class="flex w-full items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                    @click.stop="
                      selectedCountryCode = c.code;
                      countryMenuOpen = false
                    "
                  >
                    <span>{{ c.flag }}</span>
                    <span class="truncate">
                      {{ c.name }} ({{ c.dial }})
                    </span>
                  </button>
                </div>
              </div>
              <AppInput
                v-model="phoneLocal"
                class="flex-1 border-0 bg-transparent px-0 py-0"
                type="text"
                inputmode="tel"
                :label="undefined"
                :placeholder="'90 12 34 56'"
              />
            </div>
          </div>

          <!-- Email (optionnel, canal email) -->
          <div class="space-y-1">
            <AppInput
              v-model="email"
              type="email"
              :label="t('auth.email')"
              :placeholder="t('auth.emailPlaceholder')"
            />
            <p class="text-xs text-[var(--color-muted)]">
              {{ t('auth.otpEmailHint') }}
            </p>
          </div>

          <AppButton type="submit" block :loading="loading">
            {{ t('auth.requestCode') }}
          </AppButton>

          <p class="pt-2 text-xs leading-relaxed text-[var(--color-muted)]">
            {{ t('auth.legalNotice') }}
          </p>
        </form>

        <template v-else>
          <p class="mb-4 text-sm text-[var(--color-muted)]">
            {{ t('auth.whereToReceive') }}
          </p>

          <!-- Choix du canal OTP -->
          <div class="mb-6 space-y-3">
            <AppButton
              v-if="hasEmailChannel"
              type="button"
              block
              variant="secondary"
              @click="toast.success(t('auth.sentByEmail'))"
            >
              <Mail class="mr-2 h-4 w-4" />
              {{ t('auth.viaEmail') }}
            </AppButton>

            <AppButton
              v-if="hasWhatsAppChannel"
              type="button"
              block
              variant="outline"
              @click="openWhatsApp"
            >
              <MessageCircle class="mr-2 h-4 w-4" />
              {{ t('auth.viaWhatsApp') }}
            </AppButton>

            <AppButton
              v-if="hasSmsChannel"
              type="button"
              block
              variant="outline"
              @click="toast.info(t('auth.viaSmsInfo'))"
            >
              <Smartphone class="mr-2 h-4 w-4" />
              {{ t('auth.viaSms') }}
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
            <AppButton type="submit" block :loading="loading">
              {{ t('auth.verify') }}
            </AppButton>
          </form>
        </template>
      </section>
    </div>
  </main>
</template>
