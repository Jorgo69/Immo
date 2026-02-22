<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, User, Upload, CreditCard, Pencil } from 'lucide-vue-next'
import { getMyProfile, updateMyProfile, getMyPaymentMethods } from '../services/profile.service'
import { getMe, updateUser, uploadAvatar, uploadIdCard } from '../services/auth.service'
import { useAppStore } from '../stores/app'
import { getApiErrorMessage } from '../services/http'
import { AppTitle, AppCard, AppButton, AppInput, AppUpload, LanguageSwitcher, CurrencySwitcher } from '../components/ui'
import type { ProfileDto } from '../services/profile.service'
import type { AuthUserDto } from '../services/auth.service'
import type { PaymentMethodDto } from '../services/profile.service'

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const profile = ref<ProfileDto | null>(null)
const user = ref<AuthUserDto | null>(null)
const paymentMethods = ref<PaymentMethodDto[]>([])

const loading = ref(true)
const saving = ref(false)
const avatarUploading = ref(false)
const idCardUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// User (non chiffré)
const firstName = ref('')
const lastName = ref('')
const email = ref('')

// Profile (chiffré) — déverrouillage pour édition
const fullNameUnlocked = ref(false)
const fullName = ref('')
const idCardUnlocked = ref(false)
const idCard = ref('')
const profession = ref('')
const company = ref('')
const emergencyContactUnlocked = ref(false)
const emergencyContact = ref('')

const displayEmail = computed(() => user.value?.email ?? '')

const kycStatusClass = computed(() => {
  const status = profile.value?.kyc_status?.toLowerCase()
  if (status === 'verified') return 'bg-kyc-verified/15 text-kyc-verified dark:bg-kyc-verified/25 dark:text-kyc-verified'
  if (status === 'rejected') return 'bg-kyc-rejected/15 text-kyc-rejected dark:bg-kyc-rejected/25 dark:text-kyc-rejected'
  return 'bg-kyc-pending/15 text-kyc-pending dark:bg-kyc-pending/25 dark:text-kyc-pending'
})

const fullNamePlaceholder = computed(() =>
  profile.value?.full_name_masked && !fullNameUnlocked.value ? '********' : t('profile.fullNamePlaceholder')
)
const idCardPlaceholder = computed(() =>
  profile.value?.id_card_masked && !idCardUnlocked.value ? '********' : t('profile.idCardPlaceholder')
)
const emergencyContactPlaceholder = computed(() =>
  profile.value?.emergency_contact_masked && !emergencyContactUnlocked.value ? '********' : t('profile.emergencyContactPlaceholder')
)

const professionPlaceholder = computed(() =>
  profile.value?.profession_masked ? '********' : t('profile.professionPlaceholder')
)
const companyPlaceholder = computed(() =>
  profile.value?.company_masked ? '********' : t('profile.companyPlaceholder')
)

async function fetchData() {
  loading.value = true
  try {
    const [profileData, me, methods] = await Promise.all([
      getMyProfile(),
      getMe().catch(() => null),
      getMyPaymentMethods().catch(() => []),
    ])
    if (profileData) profile.value = profileData
    user.value = me
    paymentMethods.value = Array.isArray(methods) ? methods : []
    if (me) {
      firstName.value = me.first_name ?? ''
      lastName.value = me.last_name ?? ''
      email.value = me.email ?? ''
      appStore.setUser(me.id, me.role, undefined, {
        first_name: me.first_name,
        last_name: me.last_name,
        email: me.email,
      })
    }
  } finally {
    loading.value = false
  }
}

async function save(): Promise<void> {
  saving.value = true
  try {
    await Promise.all([
      updateUser({
        first_name: firstName.value.trim() || undefined,
        last_name: lastName.value.trim() || undefined,
        email: email.value.trim() || undefined,
      }),
      updateMyProfile({
        full_name: fullNameUnlocked.value ? (fullName.value.trim() || undefined) : undefined,
        id_card: idCardUnlocked.value ? (idCard.value.trim() || undefined) : undefined,
        profession: profession.value.trim() || undefined,
        company: company.value.trim() || undefined,
        emergency_contact: emergencyContactUnlocked.value ? (emergencyContact.value.trim() || undefined) : undefined,
      }),
    ])
    await fetchData()
    fullNameUnlocked.value = false
    idCardUnlocked.value = false
    emergencyContactUnlocked.value = false
  } finally {
    saving.value = false
  }
}

async function saveAndRedirect() {
  try {
    await toast.promise(save(), {
      loading: t('profile.saving'),
      success: t('profile.updateSuccess'),
      error: (e: Error) => e?.message ?? t('profile.updateError'),
    })
    router.push({ name: 'profile' })
  } catch {
    // Erreur déjà affichée par toast
  }
}

function cancel() {
  router.push({ name: 'profile' })
}

function onAvatarUpload() {
  fileInputRef.value?.click()
}

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) {
    toast.error(t('profile.avatarSoon'))
    return
  }
  avatarUploading.value = true
  try {
    const { url } = await uploadAvatar(file)
    const me = await getMe()
    if (user.value) user.value = { ...user.value, avatar_url: url }
    else user.value = me
    if (me) {
      appStore.setUser(me.id, me.role, undefined, {
        first_name: me.first_name,
        last_name: me.last_name,
        email: me.email,
      })
    }
    toast.success(t('profile.updateSuccess'))
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    avatarUploading.value = false
  }
}

async function onIdCardFiles(files: File[]) {
  if (files.length === 0) return
  idCardUploading.value = true
  try {
    await uploadIdCard(files[0])
    toast.success(t('profile.idCardUploaded'))
    await fetchData()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    idCardUploading.value = false
  }
}

function goToPaymentMethods() {
  router.push({ name: 'profile' })
}

onMounted(fetchData)
</script>

<template>
  <main class="min-h-[100dvh] bg-[var(--color-bg)] px-4 py-8 pb-28 lg:pb-8 dark:bg-gray-950">
    <div class="mx-auto w-full max-w-7xl">
      <button
        type="button"
        class="mb-6 flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        @click="cancel"
      >
        <ArrowLeft class="h-5 w-5" />
        {{ t('profile.back') }}
      </button>

      <AppTitle :level="2" class="mb-8">
        {{ t('profile.editProfile') }}
      </AppTitle>

      <p v-if="loading" class="text-[var(--color-muted)]">
        {{ t('profile.loading') }}
      </p>

      <div v-else class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <!-- Colonne 1 (span 3) : Identité & Photo + KYC -->
        <aside class="lg:col-span-3 space-y-6">
          <AppCard class="bg-white shadow-sm">
            <div class="flex flex-col items-center text-center">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                @change="onAvatarFileChange"
              />
              <button
                type="button"
                class="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[var(--color-muted)] dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50"
                :disabled="avatarUploading"
                @click="onAvatarUpload"
              >
                <img
                  v-if="user?.avatar_url"
                  :src="user.avatar_url"
                  :alt="user.first_name || 'Avatar'"
                  class="h-full w-full object-cover"
                />
                <User v-else class="h-12 w-12" />
                <span
                  v-if="avatarUploading"
                  class="absolute inset-0 flex items-center justify-center rounded-full bg-black/20"
                >
                  <span class="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </span>
              </button>
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                class="mt-4"
                :disabled="avatarUploading"
                @click="onAvatarUpload"
              >
                <Upload class="h-4 w-4" />
                {{ avatarUploading ? t('profile.saving') : t('profile.changeAvatar') }}
              </AppButton>
              <div class="mt-4 w-full">
                <span
                  v-if="profile"
                  :class="['inline-flex rounded-full px-3 py-1 text-xs font-medium', kycStatusClass]"
                >
                  {{ t('profile.kycStatus') }} : {{ profile.kyc_status }}
                </span>
              </div>
            </div>
          </AppCard>

          <AppCard class="bg-white shadow-sm">
            <h3 class="mb-4 text-lg font-semibold text-[var(--color-text)]">
              {{ t('profile.idCardDocument') }}
            </h3>
            <p v-if="user?.id_card_url" class="mb-2 text-sm text-[var(--color-muted)]">
              {{ t('profile.idCardUploaded') }}
            </p>
            <AppUpload
              :max-files="1"
              accept="image/*,application/pdf"
              :label="t('profile.idCardDocument')"
              :hint="t('profile.idCardDocumentHint')"
              :disabled="idCardUploading"
              @update:files="onIdCardFiles"
            />
          </AppCard>
        </aside>

        <!-- Colonne 2 (span 6) : Informations du compte + Profil pro + Documents -->
        <section class="space-y-6 lg:col-span-6">
          <AppCard class="bg-white shadow-sm">
            <h3 class="mb-4 text-lg font-semibold text-[var(--color-text)]">
              {{ t('profile.sectionIdentity') }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <AppInput
                v-model="firstName"
                :label="t('profile.firstName')"
                :placeholder="t('onboarding.firstNamePlaceholder')"
              />
              <AppInput
                v-model="lastName"
                :label="t('profile.lastName')"
                :placeholder="t('onboarding.lastNamePlaceholder')"
              />
            </div>
            <div class="mt-4">
              <div v-if="profile?.full_name_masked && !fullNameUnlocked" class="flex items-center gap-2">
                <AppInput
                  :model-value="'********'"
                  :label="t('profile.fullName')"
                  disabled
                />
                <AppButton type="button" variant="ghost" size="sm" class="shrink-0" @click="fullNameUnlocked = true">
                  <Pencil class="h-4 w-4" />
                  {{ t('profile.modify') }}
                </AppButton>
              </div>
              <AppInput
                v-else
                v-model="fullName"
                :label="t('profile.fullName')"
                :placeholder="fullNamePlaceholder"
              />
            </div>
            <div class="mt-4">
              <AppInput
                :model-value="displayEmail"
                :label="t('profile.email')"
                :placeholder="t('profile.emailPlaceholder')"
                disabled
              />
            </div>
          </AppCard>

          <AppCard class="bg-white shadow-sm">
            <h3 class="mb-4 text-lg font-semibold text-[var(--color-text)]">
              {{ t('profile.sectionProfessionalProfile') }}
            </h3>
            <div class="space-y-4">
              <AppInput
                v-model="profession"
                :label="t('profile.profession')"
                :placeholder="professionPlaceholder"
              />
              <AppInput
                v-model="company"
                :label="t('profile.company')"
                :placeholder="companyPlaceholder"
              />
            </div>
          </AppCard>

          <AppCard class="bg-white shadow-sm">
            <h3 class="mb-4 text-lg font-semibold text-[var(--color-text)]">
              {{ t('profile.sectionDocuments') }}
            </h3>
            <div class="space-y-4">
              <div v-if="profile?.id_card_masked && !idCardUnlocked" class="flex items-center gap-2">
                <AppInput
                  :model-value="'********'"
                  :label="t('profile.idCard')"
                  disabled
                />
                <AppButton type="button" variant="ghost" size="sm" class="shrink-0" @click="idCardUnlocked = true">
                  <Pencil class="h-4 w-4" />
                  {{ t('profile.modify') }}
                </AppButton>
              </div>
              <AppInput
                v-else
                v-model="idCard"
                :label="t('profile.idCard')"
                :placeholder="idCardPlaceholder"
              />
              <div v-if="profile?.emergency_contact_masked && !emergencyContactUnlocked" class="flex items-center gap-2">
                <AppInput
                  :model-value="'********'"
                  :label="t('profile.emergencyContact')"
                  disabled
                />
                <AppButton type="button" variant="ghost" size="sm" class="shrink-0" @click="emergencyContactUnlocked = true">
                  <Pencil class="h-4 w-4" />
                  {{ t('profile.modify') }}
                </AppButton>
              </div>
              <AppInput
                v-else
                v-model="emergencyContact"
                :label="t('profile.emergencyContact')"
                :placeholder="emergencyContactPlaceholder"
              />
              <div class="flex items-center justify-between pt-2">
                <span class="text-sm text-[var(--color-muted)]">{{ t('profile.kycStatus') }}</span>
                <span
                  v-if="profile"
                  :class="['inline-flex rounded-full px-3 py-1 text-xs font-medium', kycStatusClass]"
                >
                  {{ profile.kyc_status }}
                </span>
              </div>
            </div>
          </AppCard>

          <!-- Boutons desktop (dans la colonne) -->
          <div class="hidden items-center justify-end gap-3 lg:flex">
            <AppButton type="button" variant="outline" size="sm" @click="cancel">
              {{ t('common.cancel') }}
            </AppButton>
            <AppButton type="button" size="sm" :loading="saving" @click="saveAndRedirect">
              {{ t('profile.saveChanges') }}
            </AppButton>
          </div>
        </section>

        <!-- Colonne 3 (span 3) : Portefeuille & Sécurité -->
        <aside class="lg:col-span-3 space-y-6">
          <AppCard class="bg-white shadow-sm">
            <h3 class="mb-4 text-base font-semibold text-[var(--color-text)]">
              {{ t('profile.paymentMethods') }}
            </h3>
            <div v-if="paymentMethods.length" class="space-y-3">
              <div
                v-for="pm in paymentMethods"
                :key="pm.id"
                class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              >
                <CreditCard class="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-[var(--color-text)]">{{ pm.brand_display }}</p>
                  <p class="text-xs text-[var(--color-muted)]">{{ pm.last4_display }}</p>
                </div>
              </div>
            </div>
            <div
              v-else
              class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 dark:border-gray-700"
            >
              <CreditCard class="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p class="text-center text-sm text-[var(--color-muted)]">
                {{ t('profile.noPaymentMethods') }}
              </p>
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              block
              class="mt-4"
              @click="goToPaymentMethods"
            >
              + {{ t('profile.addCardOrAccount') }}
            </AppButton>
          </AppCard>

          <AppCard class="bg-white shadow-sm">
            <h3 class="mb-4 text-base font-semibold text-[var(--color-text)]">
              {{ t('profile.sectionPreferences') }}
            </h3>
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  {{ t('profile.prefLanguage') }}
                </label>
                <LanguageSwitcher />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  {{ t('profile.prefCurrency') }}
                </label>
                <CurrencySwitcher />
              </div>
            </div>
          </AppCard>
        </aside>
      </div>
    </div>

    <!-- Barre sticky mobile : Enregistrer les modifications -->
    <div
      class="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 lg:hidden"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-end gap-3">
        <AppButton type="button" variant="outline" size="sm" @click="cancel">
          {{ t('common.cancel') }}
        </AppButton>
        <AppButton type="button" size="sm" :loading="saving" @click="saveAndRedirect">
          {{ t('profile.saveChanges') }}
        </AppButton>
      </div>
    </div>
  </main>
</template>
