<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, Home, Briefcase, Upload, Check } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { updateProfile, updateUser, uploadAvatar } from '../services/auth.service'
import { updateMyProfile } from '../services/profile.service'
import { getApiErrorMessage } from '../services/http'
import { AppTitle, AppCard, AppButton, AppInput } from '../components/ui'
import { toast, Toaster } from 'vue-sonner'

const TOTAL_STEPS = 3
const STEPS = [
  { id: 1, key: 'stepProfile' },
  { id: 2, key: 'stepRole' },
  { id: 3, key: 'stepPreferences' },
]

const ZONE_IDS = ['abomey', 'calavi', 'fidjrosse', 'akpakpa', 'cotonou', 'godomey'] as const
const BUDGET_PRESETS = [
  [25000, 50000],
  [50000, 100000],
  [100000, 200000],
  [200000, 400000],
]

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const step = ref(1)
const loading = ref(false)
const preparing = ref(false)

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const avatarUrl = ref('')
const avatarUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const selectedRole = ref<'tenant' | 'landlord'>('tenant')
const preferredZone = ref('')
const budgetMin = ref('')
const budgetMax = ref('')

const progressPercent = computed(() => (step.value / TOTAL_STEPS) * 100)

const canGoNext = computed(() => {
  if (step.value === 1) return firstName.value.trim() && lastName.value.trim()
  if (step.value === 2) return true
  return true
})

function zoneLabel(id: string) {
  return t('home.quartiers.' + id)
}

async function saveStep1() {
  loading.value = true
  try {
    await updateProfile({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim() || undefined,
      avatar_url: avatarUrl.value.trim() || undefined,
    })
    toast.success(t('profile.updateSuccess'))
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    throw e
  } finally {
    loading.value = false
  }
}

async function saveStep2() {
  loading.value = true
  try {
    await updateUser({
      role: selectedRole.value === 'landlord' ? 'landlord' : 'tenant',
    })
    appStore.setUser(appStore.userId, selectedRole.value, false)
    toast.success(t('profile.updateSuccess'))
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    throw e
  } finally {
    loading.value = false
  }
}

async function saveStep3() {
  loading.value = true
  try {
    await updateMyProfile({
      preferred_zone: preferredZone.value || undefined,
      budget_min: budgetMin.value || undefined,
      budget_max: budgetMax.value || undefined,
    })
    toast.success(t('profile.updateSuccess'))
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    throw e
  } finally {
    loading.value = false
  }
}

async function next() {
  if (step.value === 1 && !canGoNext.value) return
  try {
    if (step.value === 1) {
      await saveStep1()
    } else if (step.value === 2) {
      await saveStep2()
    } else if (step.value === 3) {
      await saveStep3()
      preparing.value = true
      appStore.setUser(appStore.userId, appStore.userRole, true)
      await new Promise((r) => setTimeout(r, 1800))
      const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
      router.push(redirect)
      return
    }
    step.value++
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

function back() {
  if (step.value > 1) step.value--
}

function setBudgetPreset(min: number, max: number) {
  budgetMin.value = String(min)
  budgetMax.value = String(max)
}

function onAvatarClick() {
  fileInputRef.value?.click()
}

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) return
  avatarUploading.value = true
  try {
    const { url } = await uploadAvatar(file)
    avatarUrl.value = url
    toast.success(t('profile.photoSaved'))
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    avatarUploading.value = false
  }
}
</script>

<template>
  <main class="min-h-[100dvh] bg-[#F9FAFB] px-4 py-8 dark:bg-gray-950">
    <div class="mx-auto max-w-2xl">
      <!-- Progress bar -->
      <div class="mb-8">
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            class="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
        <div class="mt-2 flex justify-between text-xs text-[var(--color-muted)]">
          <span>{{ t('onboarding.' + STEPS[step - 1]?.key) }}</span>
          <span>{{ step }} / {{ TOTAL_STEPS }}</span>
        </div>
      </div>

      <!-- Preparing screen -->
      <div
        v-if="preparing"
        class="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        <p class="mt-4 text-sm font-medium text-[var(--color-text)]">
          {{ t('onboarding.preparingDashboard') }}
        </p>
      </div>

      <template v-else>
        <AppTitle :level="2" class="mb-2">
          {{ t('onboarding.title') }}
        </AppTitle>
        <p class="mb-8 text-sm text-[var(--color-muted)]">
          {{ t('onboarding.intro') }}
        </p>

        <!-- Step 1: Profil -->
        <Transition name="fade" mode="out-in">
          <AppCard v-if="step === 1" key="step1" class="bg-white shadow-sm">
            <h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
              <User class="h-5 w-5 text-[var(--color-accent)]" />
              {{ t('onboarding.stepProfile') }}
            </h3>
            <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                @change="onAvatarFileChange"
              />
              <button
                type="button"
                class="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:bg-emerald-50/50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-[var(--color-accent)] disabled:opacity-50"
                :disabled="avatarUploading"
                @click="onAvatarClick"
              >
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  class="absolute inset-0 h-full w-full object-cover"
                />
                <template v-else>
                  <Upload class="h-8 w-8" />
                  <span class="mt-1 text-xs">{{ t('onboarding.avatarUrl') }}</span>
                </template>
                <span
                  v-if="avatarUploading"
                  class="absolute inset-0 flex items-center justify-center rounded-full bg-black/20"
                >
                  <span class="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </span>
              </button>
              <div class="min-w-0 flex-1 space-y-4">
                <AppInput
                  v-model="firstName"
                  :label="t('onboarding.firstName')"
                  :placeholder="t('onboarding.firstNamePlaceholder')"
                />
                <AppInput
                  v-model="lastName"
                  :label="t('onboarding.lastName')"
                  :placeholder="t('onboarding.lastNamePlaceholder')"
                />
                <AppInput
                  v-model="email"
                  type="email"
                  :label="t('onboarding.email')"
                  :placeholder="t('onboarding.emailPlaceholder')"
                />
              </div>
            </div>
          </AppCard>

          <!-- Step 2: Rôle -->
          <AppCard v-else-if="step === 2" key="step2" class="bg-white shadow-sm">
            <h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
              <Briefcase class="h-5 w-5 text-[var(--color-accent)]" />
              {{ t('onboarding.stepRole') }}
            </h3>
            <p class="mb-2 text-sm text-[var(--color-muted)]">
              Comment souhaitez-vous utiliser Immo Bénin ?
            </p>
            <p class="mb-6 text-xs text-[var(--color-muted)]">
              {{ t('onboarding.roleDefaultHint') }}
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div
                role="button"
                tabindex="0"
                :class="[
                  'relative flex flex-col items-center rounded-xl border-2 py-6 text-center transition cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
                  selectedRole === 'tenant'
                    ? 'border-[var(--color-accent)] bg-emerald-50 shadow-[0_0_0_2px_var(--color-accent)] dark:bg-emerald-950/40 dark:shadow-[0_0_0_2px_var(--color-accent)]'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                ]"
                @click="selectedRole = 'tenant'"
                @keydown.enter.prevent="selectedRole = 'tenant'"
                @keydown.space.prevent="selectedRole = 'tenant'"
              >
                <Check
                  v-if="selectedRole === 'tenant'"
                  class="absolute right-3 top-3 h-6 w-6 text-[var(--color-accent)]"
                  aria-hidden
                />
                <Home
                  :class="['mb-3 h-10 w-10', selectedRole === 'tenant' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]']"
                />
                <span class="font-semibold text-[var(--color-text)]">
                  {{ t('onboarding.roleTenantTitle') }}
                </span>
                <span class="mt-1 text-xs text-[var(--color-muted)]">
                  {{ t('onboarding.roleTenantDesc') }}
                </span>
              </div>
              <div
                role="button"
                tabindex="0"
                :class="[
                  'relative flex flex-col items-center rounded-xl border-2 py-6 text-center transition cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
                  selectedRole === 'landlord'
                    ? 'border-[var(--color-accent)] bg-emerald-50 shadow-[0_0_0_2px_var(--color-accent)] dark:bg-emerald-950/40 dark:shadow-[0_0_0_2px_var(--color-accent)]'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                ]"
                @click="selectedRole = 'landlord'"
                @keydown.enter.prevent="selectedRole = 'landlord'"
                @keydown.space.prevent="selectedRole = 'landlord'"
              >
                <Check
                  v-if="selectedRole === 'landlord'"
                  class="absolute right-3 top-3 h-6 w-6 text-[var(--color-accent)]"
                  aria-hidden
                />
                <Briefcase
                  :class="['mb-3 h-10 w-10', selectedRole === 'landlord' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]']"
                />
                <span class="font-semibold text-[var(--color-text)]">
                  {{ t('onboarding.roleLandlordTitle') }}
                </span>
                <span class="mt-1 text-xs text-[var(--color-muted)]">
                  {{ t('onboarding.roleLandlordDesc') }}
                </span>
              </div>
            </div>
          </AppCard>

          <!-- Step 3: Préférences -->
          <AppCard v-else-if="step === 3" key="step3" class="bg-white shadow-sm">
            <h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
              <Home class="h-5 w-5 text-[var(--color-accent)]" />
              {{ t('onboarding.stepPreferences') }}
            </h3>
            <div class="space-y-6">
              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  {{ t('onboarding.zoneLabel') }}
                </label>
                <div class="flex flex-wrap gap-2">
                  <AppButton
                    v-for="zoneId in ZONE_IDS"
                    :key="zoneId"
                    type="button"
                    variant="outline"
                    size="sm"
                    :class="[
                      preferredZone === zoneId
                        ? 'border-[var(--color-accent)] bg-emerald-50 text-[var(--color-accent)] dark:bg-emerald-950/30'
                        : '',
                    ]"
                    @click="preferredZone = preferredZone === zoneId ? '' : zoneId"
                  >
                    {{ zoneLabel(zoneId) }}
                  </AppButton>
                </div>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  {{ t('onboarding.budgetLabel') }}
                </label>
                <p class="mb-3 text-xs text-[var(--color-muted)]">
                  {{ t('onboarding.budgetQuick') }}
                </p>
                <div class="mb-4 flex flex-wrap gap-2">
                  <AppButton
                    v-for="(preset, i) in BUDGET_PRESETS"
                    :key="i"
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="setBudgetPreset(preset[0], preset[1])"
                  >
                    {{ (preset[0] / 1000).toFixed(0) }}k – {{ (preset[1] / 1000).toFixed(0) }}k
                  </AppButton>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <AppInput
                    v-model="budgetMin"
                    type="number"
                    :label="t('onboarding.budgetMin')"
                    placeholder="25000"
                  />
                  <AppInput
                    v-model="budgetMax"
                    type="number"
                    :label="t('onboarding.budgetMax')"
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>
          </AppCard>
        </Transition>

        <div class="mt-8 flex items-center justify-between">
          <AppButton
            v-if="step > 1"
            type="button"
            variant="outline"
            size="sm"
            @click="back"
          >
            {{ t('onboarding.back') }}
          </AppButton>
          <div v-else />
          <AppButton
            type="button"
            size="sm"
            :loading="loading"
            :disabled="step === 1 && !canGoNext"
            @click="next"
          >
            {{ step === 3 ? t('onboarding.submit') : t('onboarding.next') }}
          </AppButton>
        </div>
      </template>
    </div>
    <!-- Toaster dans la vue pour que les toasts s'affichent (z-index au-dessus du reste) -->
    <div class="fixed left-0 right-0 top-0 z-[9999] flex justify-center pt-6">
      <Toaster position="top-center" rich-colors />
    </div>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
