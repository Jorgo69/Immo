<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import gsap from 'gsap'
import { useAppStore } from '../stores/app'
import { Smartphone, Mail, MessageCircle, ChevronDown } from 'lucide-vue-next'
import { requestOtp, verifyOtp, type AuthChannel } from '../services/auth.service'
import { AppInputPremium, AppButton, AppCardPremium } from '../components/ui'

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
    appStore.setCurrentUser(data.user)
    toast.success(t('auth.loginSuccess'))
    const redirect =
      data.is_profile_complete
        ? ((router.currentRoute.value.query.redirect as string) || '/admin')
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
  <main class="min-h-screen bg-ui-background dark:bg-brand-dark flex flex-col justify-center relative overflow-hidden">
    <!-- Subtle Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-40">
      <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary-emerald blur-[140px] rounded-full" />
      <div class="absolute bottom-[0%] -right-[10%] w-[40%] h-[40%] bg-blue-500 blur-[120px] rounded-full" />
    </div>

    <div class="relative mx-auto w-full max-w-md px-6 py-12 space-y-10">
      <!-- En-tête Premium -->
      <section class="auth-hero space-y-4 text-center">
        <div
          class="mx-auto inline-flex items-center justify-center rounded-3xl bg-primary-emerald p-4 shadow-glow-emerald text-white"
        >
          <Smartphone class="h-8 w-8" />
        </div>
        <div>
          <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 italic">
            IMMO<span class="text-primary-emerald">.PRO</span>
          </h1>
          <p class="mt-2 text-ui-muted font-bold uppercase tracking-widest text-xs">
            {{ t('auth.subtitle') }}
          </p>
        </div>
      </section>

      <!-- Carte Auth Premium -->
      <AppCardPremium class="auth-card p-8 shadow-glow-emerald/5">
        <form
          v-if="step === 'phone'"
          class="space-y-6"
          @submit.prevent="requestCode()"
        >
          <!-- Phone input avec sélecteur de pays intégré Premium -->
            <AppInputPremium
              v-model="phoneLocal"
              type="text"
              inputmode="tel"
              :placeholder="'90 12 34 56'"
              input-class="font-bold tracking-widest"
              required
            >
              <template #prefix>
                <div class="relative flex items-center pr-2 border-r border-ui-border/50 dark:border-ui-border-dark/50">
                  <button
                    type="button"
                    class="flex items-center gap-2 pl-4 pr-3 py-3.5 text-base font-bold text-gray-900 dark:text-gray-100 hover:bg-primary-emerald/5 transition-colors rounded-l-2xl"
                    @click.stop="countryMenuOpen = !countryMenuOpen"
                  >
                    <span class="text-xl">{{ selectedCountry.flag }}</span>
                    <span class="text-base">
                      {{ selectedCountry.dial }}
                    </span>
                    <ChevronDown class="h-4 w-4 text-ui-muted transition-transform duration-300" :class="countryMenuOpen ? 'rotate-180' : ''" />
                  </button>
                  
                  <div
                    v-if="countryMenuOpen"
                    class="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-ui-border bg-white p-2 shadow-xl backdrop-blur-xl dark:border-ui-border-dark dark:bg-brand-dark/95 animate-in fade-in slide-in-from-top-2"
                  >
                    <button
                      v-for="c in countries"
                      :key="c.code"
                      type="button"
                      class="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-emerald/10 text-sm font-bold text-gray-900 dark:text-gray-100 transition-colors"
                      @click.stop="
                        selectedCountryCode = c.code;
                        countryMenuOpen = false
                      "
                    >
                      <span class="text-xl">{{ c.flag }}</span>
                      <span class="truncate">
                        {{ c.name }}
                      </span>
                      <span class="ml-auto text-ui-muted text-xs">{{ c.dial }}</span>
                    </button>
                  </div>
                </div>
              </template>
            </AppInputPremium>

          <!-- Email Premium -->
          <div class="space-y-2">
            <AppInputPremium
              v-model="email"
              type="email"
              :label="t('auth.email')"
              :placeholder="t('auth.emailPlaceholder')"
            />
            <p class="ml-1 text-[10px] font-bold text-ui-muted uppercase tracking-wider">
              {{ t('auth.otpEmailHint') }}
            </p>
          </div>

          <AppButton type="submit" block size="lg" class="py-4 font-bold text-lg shadow-glow-emerald" :loading="loading">
            {{ t('auth.requestCode') }}
          </AppButton>

          <p class="pt-4 text-[10px] font-medium leading-relaxed text-ui-muted text-center uppercase tracking-widest px-4">
            {{ t('auth.legalNotice') }}
          </p>
        </form>

        <template v-else>
          <div class="text-center mb-8">
            <h2 class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 italic">Vérification</h2>
            <p class="text-sm font-medium text-ui-muted">
              {{ t('auth.whereToReceive') }}
            </p>
          </div>

          <!-- Choix du canal OTP Premium -->
          <div class="mb-8 grid grid-cols-1 gap-4">
            <AppButton
              v-if="hasEmailChannel"
              type="button"
              block
              variant="secondary"
              class="h-14 font-bold"
              @click="toast.success(t('auth.sentByEmail'))"
            >
              <Mail class="mr-3 h-5 w-5" />
              {{ t('auth.viaEmail') }}
            </AppButton>

            <div class="grid grid-cols-2 gap-4">
              <AppButton
                v-if="hasWhatsAppChannel"
                type="button"
                variant="outline"
                class="h-14 font-bold border-2"
                @click="openWhatsApp"
              >
                <MessageCircle class="mr-2 h-5 w-5 text-emerald-500" />
                WhatsApp
              </AppButton>

              <AppButton
                v-if="hasSmsChannel"
                type="button"
                variant="outline"
                class="h-14 font-bold border-2"
                @click="toast.info(t('auth.viaSmsInfo'))"
              >
                <Smartphone class="mr-2 h-5 w-5 text-blue-500" />
                SMS
              </AppButton>
            </div>
          </div>

          <form class="space-y-6" @submit.prevent="verifyCode()">
            <AppInputPremium
              v-model="code"
              type="text"
              input-class="text-center text-2xl tracking-[1em]"
              :label="t('auth.code')"
              :placeholder="'000000'"
              maxlength="6"
            />
            <AppButton type="submit" block size="lg" class="py-4 font-bold text-lg shadow-glow-emerald" :loading="loading">
              {{ t('auth.verify') }}
            </AppButton>
            
            <button 
              type="button"
              class="w-full text-center text-xs font-bold uppercase tracking-widest text-primary-emerald hover:underline"
              @click="step = 'phone'"
            >
              Modifier le numéro
            </button>
          </form>
        </template>
      </AppCardPremium>
    </div>
  </main>
</template>
