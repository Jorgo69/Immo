<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Home, Briefcase, Upload, Check, MapPin, ShieldCheck, ChevronRight } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { uploadAvatar } from '../services/auth.service'
import { getOnboardingDraft, updateOnboardingDraft, finalizeOnboarding } from '../services/onboarding.service'
import { getApiErrorMessage } from '../services/http'
import { AppTitle, AppButton, AppInput } from '../components/ui'
import { toast, Toaster } from 'vue-sonner'

const TOTAL_STEPS = computed(() => selectedRole.value === 'tenant' ? 3 : 4)

const getStepKey = (index: number) => {
  if (selectedRole.value === 'tenant') {
    return ['stepProfile', 'stepRole', 'stepPreferences'][index - 1]
  }
  return ['stepProfile', 'stepRole', 'stepLegal', 'stepPreferences'][index - 1]
}
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

const selectedRole = ref<'tenant' | 'landlord' | 'agent'>('tenant')
const preferredZones = ref<string[]>([])
const budgetMin = ref<string | number>('')
const budgetMax = ref<string | number>('')

const company = ref('')
const ifu = ref('')
const rccm = ref('')

const canGoNext = computed(() => {
  if (step.value === 1) return firstName.value.trim() && lastName.value.trim()
  return true
})

function zoneLabel(id: string) {
  return t('home.quartiers.' + id)
}

onMounted(async () => {
  try {
    const draft = await getOnboardingDraft()
    if (draft) {
      if (draft.first_name) firstName.value = draft.first_name
      if (draft.last_name) lastName.value = draft.last_name
      if (draft.email) email.value = draft.email
      if (draft.avatar_url) avatarUrl.value = draft.avatar_url
      if (draft.role) selectedRole.value = draft.role as any
      if (draft.company) company.value = draft.company
      if (draft.ifu) ifu.value = draft.ifu
      if (draft.rccm) rccm.value = draft.rccm
      if (draft.preferred_zones) preferredZones.value = draft.preferred_zones
      if (draft.budget_min) budgetMin.value = draft.budget_min
      if (draft.budget_max) budgetMax.value = draft.budget_max
    }
  } catch (e) {
    // Si pas de brouillon, on ignore silencieusement
  }
})

function toggleZone(zoneId: string) {
  const current = preferredZones.value
  const hasZone = current.includes(zoneId)
  preferredZones.value = hasZone
    ? current.filter((z) => z !== zoneId)
    : [...current, zoneId]
}

function allowOnlyNumbers(event: KeyboardEvent) {
  if (!/^[0-9]$/.test(event.key)) {
    event.preventDefault()
  }
}

function formatRCCM(value: string) {
  if (!value) return ''
  
  // On nettoie la chaîne de tout ce qui n'est pas alphanumérique
  let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  if (!clean.startsWith('R')) return clean ? 'R' : ''
  if (clean.length === 1) return 'R'
  if (!clean.startsWith('RB')) return 'R' // Force RB
  
  let result = 'RB/'
  let remain = clean.substring(2)
  if (remain.length === 0) return result
  
  // 1. Ville (Lettres uniquement)
  let cityMatch = remain.match(/^[A-Z]+/)
  let city = cityMatch ? cityMatch[0] : ''
  if (!city) return result // Si le premier caractère après RB n'est pas une lettre, on bloque
  
  result += city
  remain = remain.substring(city.length)
  
  // Si on n'a plus rien, on ajoute le slash s'il l'a tapé lui-même
  if (remain.length === 0) {
     if (value.endsWith('/')) return result + '/'
     return result
  }
  
  result += '/'
  
  // 2. Année (2 chiffres maximum)
  let yearMatch = remain.match(/^\d{1,2}/)
  let year = yearMatch ? yearMatch[0] : ''
  if (!year) return result // S'il a tapé une lettre ici, on bloque l'affichage
  
  result += year
  remain = remain.substring(year.length)
  
  if (remain.length === 0) {
    if (year.length === 2 && value.endsWith(' ')) return result + ' '
    return result
  }
  if (year.length < 2) return result // S'il a tapé autre chose avant d'avoir mis 2 chiffres
  
  result += ' '
  
  // 3. Forme juridique (1 Lettre)
  let typeMatch = remain.match(/^[A-Z]/)
  let type = typeMatch ? typeMatch[0] : ''
  if (!type) return result // S'il a tapé un chiffre ici, on bloque
  
  result += type
  remain = remain.substring(1)
  
  if (remain.length === 0) {
    if (value.endsWith(' ')) return result + ' '
    return result
  }
  
  result += ' '
  
  // 4. Numéro (Chiffres uniquement)
  let numMatch = remain.match(/^\d+/)
  let num = numMatch ? numMatch[0] : ''
  
  result += num
  return result
}

async function saveStep1() {
  loading.value = true
  try {
    await updateOnboardingDraft({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim() || undefined,
      avatar_url: avatarUrl.value.trim() || undefined,
    })
    // toast.success(t('profile.updateSuccess'))
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
    await updateOnboardingDraft({
      role: selectedRole.value,
    })
    // On met à jour le store localement sans throw error depuis le back (juste pour l'UI)
    appStore.setUser(appStore.userId, selectedRole.value as any, false)
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    throw e
  } finally {
    loading.value = false
  }
}

async function saveStepLegal() {
  if (ifu.value && !/^\d{13}$/.test(ifu.value)) {
    toast.error("L'IFU doit comporter exactement 13 chiffres.")
    return
  }
  if (rccm.value && !/^RB\/[a-zA-Z]+\/\d{2}\s*[a-zA-Z]\s*\d+$/.test(rccm.value)) {
    toast.error("Le RCCM doit respecter le format béninois (ex: RB/COT/25 A 1234).")
    return
  }

  loading.value = true
  try {
    await updateOnboardingDraft({
      company: company.value || undefined,
      ifu: ifu.value || undefined,
      rccm: rccm.value || undefined,
    })
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    throw e
  } finally {
    loading.value = false
  }
}

async function saveStepFinal() {
  loading.value = true
  try {
    await updateOnboardingDraft({
      preferred_zones: preferredZones.value.length > 0 ? preferredZones.value : undefined,
      budget_min: budgetMin.value ? String(budgetMin.value) : undefined,
      budget_max: budgetMax.value ? String(budgetMax.value) : undefined,
    })
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    throw e
  } finally {
    loading.value = false
  }
}

async function finishSetup() {
  preparing.value = true
  try {
    // Demande au serveur de consolider le cache Redis dans PostgreSQL
    await finalizeOnboarding()

    appStore.setUser(appStore.userId, appStore.userRole, true)
    await appStore.refreshMe().catch(() => {})
    toast.success(t('profile.updateSuccess'))
    await new Promise((r) => setTimeout(r, 1800))
    const redirect = (router.currentRoute.value.query.redirect as string) || '/admin'
    router.push(redirect)
  } catch (err) {
    toast.error(getApiErrorMessage(err))
    preparing.value = false
  }
}

async function next() {
  if (step.value === 1 && !canGoNext.value) return
  try {
    if (step.value === 1) {
      await saveStep1()
    } else if (step.value === 2) {
      await saveStep2()
    } else if (step.value === 3 && selectedRole.value !== 'tenant') {
      await saveStepLegal()
    } else if (step.value === TOTAL_STEPS.value) {
      await saveStepFinal()
      await finishSetup()
      return
    }
    
    if (step.value === 2 && selectedRole.value === 'tenant') {
      // Le tenant passe directement à l'étape finale (préférences) => index 3
      // mais chez lui, l'étape 3 EST la finale
      step.value++
    } else {
      step.value++
    }
  } catch (e) {
    toast.error(getApiErrorMessage(e))
  }
}

function back() {
  if (step.value > 1) step.value--
}

function setBudgetPreset(min: number | string, max: number | string) {
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
  <main class="relative flex min-h-[100dvh] items-center justify-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 overflow-hidden">
    <!-- Premium Background (Dotted + Glow) -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>
      <div class="absolute h-[600px] w-[600px] rounded-full bg-[var(--color-accent)] opacity-5 blur-[120px] mix-blend-multiply dark:opacity-10 dark:mix-blend-screen"></div>
    </div>

    <!-- Main Container Card -->
    <div class="relative w-full max-w-xl z-10 transition-all duration-500">
      
      <!-- Logo / Header (optional, but looks good in onboarding) -->
      <div class="flex flex-col items-center justify-center mb-8 text-center">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-[var(--color-accent)]/10 dark:bg-gray-800">
          <Home class="h-8 w-8 text-[var(--color-accent)]" />
        </div>
        <AppTitle :level="2" class="text-3xl font-bold tracking-tight">
          {{ t('onboarding.title') }}
        </AppTitle>
        <p class="mt-2 text-sm text-[var(--color-muted)] max-w-sm">
          {{ t('onboarding.intro') }}
        </p>
      </div>

      <!-- Segmented Progress Bar -->
      <div class="mb-8 flex items-center justify-center gap-2 px-8">
        <div
          v-for="s in TOTAL_STEPS"
          :key="s"
          class="h-1.5 flex-1 rounded-full transition-all duration-500 ease-out"
          :class="s <= step ? 'bg-[var(--color-accent)] scale-y-100 opacity-100' : 'bg-gray-200 dark:bg-gray-800 scale-y-75 opacity-50'"
        />
      </div>
      <div class="mb-8 flex justify-between px-8 text-xs font-medium text-[var(--color-muted)]">
        <span>{{ t('onboarding.' + getStepKey(step)) }}</span>
        <span>Étape {{ step }} sur {{ TOTAL_STEPS }}</span>
      </div>

      <!-- Content Box -->
      <div class="relative min-h-[420px] rounded-[2rem] border border-white/50 bg-white/70 p-6 sm:p-10 shadow-2xl backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/70 sm:min-h-[480px]">
        
        <!-- Preparing screen -->
        <div
          v-if="preparing"
          class="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[2rem] bg-white/90 backdrop-blur-sm dark:bg-gray-900/90"
        >
          <div class="relative flex h-20 w-20 items-center justify-center">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-20"></span>
            <span class="relative inline-flex h-12 w-12 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin"></span>
          </div>
          <p class="mt-6 text-sm font-semibold tracking-wide text-[var(--color-text)] animate-pulse">
            {{ t('onboarding.preparingDashboard') }}
          </p>
        </div>

        <Transition name="slide-card" mode="out-in">
          <!-- Step 1: Profil -->
          <div v-if="step === 1" key="step1" class="flex flex-col h-full space-y-8">
            <div class="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                <User class="h-5 w-5" />
              </div>
              <h3 class="text-xl font-bold text-[var(--color-text)]">
                {{ t('onboarding.stepProfile') }}
              </h3>
            </div>
            
            <div class="flex flex-col items-center gap-8 sm:flex-row sm:items-start flex-1">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                @change="onAvatarFileChange"
              />
              <button
                type="button"
                class="group relative flex h-32 w-32 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-[var(--color-muted)] transition-all hover:scale-105 hover:border-[var(--color-accent)] hover:bg-emerald-50/50 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[var(--color-accent)] disabled:opacity-50"
                :disabled="avatarUploading"
                @click="onAvatarClick"
              >
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  class="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                <template v-else>
                  <Upload class="mb-2 h-8 w-8 transition-transform group-hover:-translate-y-1 group-hover:text-[var(--color-accent)]" />
                  <span class="text-[10px] font-medium uppercase tracking-wider">{{ t('onboarding.avatarUrl') }}</span>
                </template>
                <span
                  v-if="avatarUploading"
                  class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
                >
                  <span class="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </span>
              </button>

              <div class="flex-1 w-full space-y-5">
                <AppInput
                  v-model="firstName"
                  :label="t('onboarding.firstName')"
                  :placeholder="t('onboarding.firstNamePlaceholder')"
                  class="bg-white/50 focus-within:bg-white dark:bg-gray-800/50 dark:focus-within:bg-gray-800 transition-colors rounded-xl"
                />
                <AppInput
                  v-model="lastName"
                  :label="t('onboarding.lastName')"
                  :placeholder="t('onboarding.lastNamePlaceholder')"
                  class="bg-white/50 focus-within:bg-white dark:bg-gray-800/50 dark:focus-within:bg-gray-800 transition-colors rounded-xl"
                />
                <AppInput
                  v-model="email"
                  type="email"
                  :label="t('onboarding.email')"
                  :placeholder="t('onboarding.emailPlaceholder')"
                  class="bg-white/50 focus-within:bg-white dark:bg-gray-800/50 dark:focus-within:bg-gray-800 transition-colors rounded-xl"
                />
              </div>
            </div>
          </div>

          <!-- Step 2: Rôle -->
          <div v-else-if="step === 2" key="step2" class="flex flex-col h-full space-y-8">
             <div class="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400">
                <Briefcase class="h-5 w-5" />
              </div>
              <h3 class="text-xl font-bold text-[var(--color-text)]">
                {{ t('onboarding.stepRole') }}
              </h3>
            </div>
            
            <div class="flex-1 flex flex-col justify-center">
              <p class="mb-6 text-center text-sm font-medium text-[var(--color-muted)]">
                Comment souhaitez-vous utiliser l'application ?
              </p>
              <div class="grid gap-5 sm:grid-cols-3">
                <!-- Tenant Card -->
                <div
                  role="button"
                  tabindex="0"
                  class="group relative flex flex-col items-center justify-center rounded-3xl border-2 p-6 text-center transition-all duration-300 cursor-pointer select-none outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/20"
                  :class="[
                    selectedRole === 'tenant'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-xl shadow-[var(--color-accent)]/10 scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                  ]"
                  @click="selectedRole = 'tenant'"
                  @keydown.enter.prevent="selectedRole = 'tenant'"
                  @keydown.space.prevent="selectedRole = 'tenant'"
                >
                  <div class="absolute right-3 top-3 transition-transform duration-300" :class="selectedRole === 'tenant' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'">
                    <Check class="h-5 w-5 text-[var(--color-accent)]" stroke-width="3" />
                  </div>
                  <div class="mb-4 rounded-full p-4 transition-colors duration-300" :class="selectedRole === 'tenant' ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'">
                     <User class="h-6 w-6" />
                  </div>
                  <span class="text-sm font-bold text-[var(--color-text)]">
                    {{ t('onboarding.roleTenantTitle') }}
                  </span>
                  <span class="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
                    {{ t('onboarding.roleTenantDesc') }}
                  </span>
                </div>

                <!-- Landlord Card -->
                <div
                  role="button"
                  tabindex="0"
                  class="group relative flex flex-col items-center justify-center rounded-3xl border-2 p-6 text-center transition-all duration-300 cursor-pointer select-none outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/20"
                  :class="[
                    selectedRole === 'landlord'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-xl shadow-[var(--color-accent)]/10 scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                  ]"
                  @click="selectedRole = 'landlord'"
                  @keydown.enter.prevent="selectedRole = 'landlord'"
                  @keydown.space.prevent="selectedRole = 'landlord'"
                >
                  <div class="absolute right-3 top-3 transition-transform duration-300" :class="selectedRole === 'landlord' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'">
                    <Check class="h-5 w-5 text-[var(--color-accent)]" stroke-width="3" />
                  </div>
                  <div class="mb-4 rounded-full p-4 transition-colors duration-300" :class="selectedRole === 'landlord' ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'">
                     <Home class="h-6 w-6" />
                  </div>
                  <span class="text-sm font-bold text-[var(--color-text)]">
                    {{ t('onboarding.roleLandlordTitle') }}
                  </span>
                  <span class="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
                    {{ t('onboarding.roleLandlordDesc') }}
                  </span>
                </div>

                <!-- Agent Card -->
                <div
                  role="button"
                  tabindex="0"
                  class="group relative flex flex-col items-center justify-center rounded-3xl border-2 p-6 text-center transition-all duration-300 cursor-pointer select-none outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/20"
                  :class="[
                    selectedRole === 'agent'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-xl shadow-[var(--color-accent)]/10 scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                  ]"
                  @click="selectedRole = 'agent'"
                  @keydown.enter.prevent="selectedRole = 'agent'"
                  @keydown.space.prevent="selectedRole = 'agent'"
                >
                  <div class="absolute right-3 top-3 transition-transform duration-300" :class="selectedRole === 'agent' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'">
                    <Check class="h-5 w-5 text-[var(--color-accent)]" stroke-width="3" />
                  </div>
                  <div class="mb-4 rounded-full p-4 transition-colors duration-300" :class="selectedRole === 'agent' ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'">
                     <Briefcase class="h-6 w-6" />
                  </div>
                  <span class="text-sm font-bold text-[var(--color-text)]">
                    {{ t('onboarding.roleAgentTitle') }}
                  </span>
                  <span class="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
                    {{ t('onboarding.roleAgentDesc') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3 : Informations Pro (Landlord & Agent only) -->
          <div v-else-if="step === 3 && selectedRole !== 'tenant'" key="stepLegal" class="flex flex-col h-full space-y-8">
             <div class="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400">
                <ShieldCheck class="h-5 w-5" />
              </div>
              <h3 class="text-xl font-bold text-[var(--color-text)]">
                {{ t('onboarding.stepLegal') }}
              </h3>
            </div>
            
            <div class="flex-1 flex flex-col justify-center">
              <p class="mb-6 text-sm font-medium text-[var(--color-muted)] leading-relaxed text-center sm:text-left">
                {{ t('onboarding.legalDesc') }}
              </p>
              <div class="space-y-5 rounded-2xl bg-gray-50/50 p-6 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                <AppInput
                  v-if="selectedRole === 'agent'"
                  v-model="company"
                  :label="t('onboarding.companyName')"
                  :placeholder="t('onboarding.companyPlaceholder')"
                  class="bg-white focus-within:bg-white dark:bg-gray-900 dark:focus-within:bg-gray-900 transition-colors rounded-xl"
                />
                <div :class="selectedRole === 'agent' ? 'grid gap-5 sm:grid-cols-2' : ''">
                  <AppInput
                    v-model="ifu"
                    :label="t('onboarding.ifu')"
                    :placeholder="t('onboarding.ifuPlaceholder')"
                    class="bg-white focus-within:bg-white dark:bg-gray-900 dark:focus-within:bg-gray-900 transition-colors rounded-xl"
                    :maxlength="13"
                    @keypress="allowOnlyNumbers"
                  />
                  <AppInput
                    v-if="selectedRole === 'agent'"
                    v-model="rccm"
                    :label="t('onboarding.rccm')"
                    :placeholder="t('onboarding.rccmPlaceholder')"
                    class="bg-white focus-within:bg-white dark:bg-gray-900 dark:focus-within:bg-gray-900 transition-colors rounded-xl"
                    :maxlength="30"
                    @update:model-value="(val) => rccm = formatRCCM(String(val))"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4 : Préférences (renuméroté selon TOTAL_STEPS dynamique) -->
          <div v-else-if="step === TOTAL_STEPS" key="stepPreferences" class="flex flex-col h-full space-y-8">
            <div class="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
                <MapPin class="h-5 w-5" />
              </div>
              <h3 class="text-xl font-bold text-[var(--color-text)]">
                {{ t('onboarding.stepPreferences') }}
              </h3>
            </div>

            <div class="flex-1 space-y-8">
              <!-- Zones -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text)]">
                    {{ t(selectedRole === 'landlord' ? 'onboarding.zoneLabelLandlord' : 'onboarding.zoneLabelTenant') }}
                  </label>
                  <p class="mt-1 text-xs text-[var(--color-muted)]">
                    {{ t('onboarding.zoneMultiHint') }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2.5">
                  <button
                    v-for="zoneId of ZONE_IDS"
                    :key="zoneId"
                    type="button"
                    :class="[
                      'rounded-full border-2 px-5 py-2.5 text-sm font-medium transition-all duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/20',
                      preferredZones.includes(zoneId)
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600',
                    ]"
                    @click.prevent="toggleZone(zoneId)"
                  >
                    {{ zoneLabel(zoneId) }}
                  </button>
                </div>
              </div>

              <!-- Budget -->
              <div class="space-y-4 rounded-2xl bg-gray-50 p-5 dark:bg-gray-800/50">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text)]">
                    {{ t(selectedRole === 'landlord' ? 'onboarding.budgetLabelLandlord' : 'onboarding.budgetLabelTenant') }}
                  </label>
                  <p class="mt-1 text-xs text-[var(--color-muted)]">
                    {{ t(selectedRole === 'landlord' ? 'onboarding.budgetQuickLandlord' : 'onboarding.budgetQuickTenant') }}
                  </p>
                </div>
                
                <div class="flex flex-wrap gap-2">
                  <AppButton
                    v-for="(preset, i) in BUDGET_PRESETS"
                    :key="i"
                    type="button"
                    variant="outline"
                    class="rounded-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] text-xs font-semibold px-4 py-2"
                    @click="setBudgetPreset(String(preset[0]), String(preset[1]))"
                  >
                    {{ (preset[0] / 1000).toFixed(0) }}k – {{ (preset[1] / 1000).toFixed(0) }}k
                  </AppButton>
                </div>

                <div class="grid gap-5 sm:grid-cols-2 pt-2">
                  <AppInput
                    v-model="budgetMin"
                    type="number"
                    :label="t('onboarding.budgetMin')"
                    placeholder="25 000"
                    class="bg-white dark:bg-gray-900 rounded-xl"
                  />
                  <AppInput
                    v-model="budgetMax"
                    type="number"
                    :label="t('onboarding.budgetMax')"
                    placeholder="100 000"
                    class="bg-white dark:bg-gray-900 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Fixed Bottom Navigation within Card -->
        <div class="sticky bottom-0 mt-8 flex items-center justify-between border-t border-gray-100 pt-6 dark:border-gray-800 bg-white/50 backdrop-blur-md dark:bg-gray-900/50 -mx-6 px-6 sm:-mx-10 sm:px-10 -mb-6 pb-6 rounded-b-[2rem]">
          <AppButton
            v-if="step > 1"
            type="button"
            variant="ghost"
            class="font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            @click="back"
          >
            <!-- {{ t('onboarding.back') }} -->
            Retour
          </AppButton>
          <div v-else />
          
          <AppButton
            type="button"
            variant="primary"
            class="shadow-lg shadow-[var(--color-accent)]/20 px-8 py-2.5 rounded-full font-bold tracking-wide transition-transform hover:scale-105 active:scale-95"
            :loading="loading"
            :disabled="step === 1 && !canGoNext"
            @click="next"
          >
            {{ step === TOTAL_STEPS ? t('onboarding.submit') || 'Terminer' : t('onboarding.next') || 'Suivant' }}
            <ChevronRight v-if="step < TOTAL_STEPS" class="ml-2 h-4 w-4" />
            <Check v-else class="ml-2 h-4 w-4" />
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Toaster -->
    <div class="fixed left-0 right-0 top-0 z-[9999] flex justify-center pt-6 pointer-events-none">
      <Toaster position="top-center" rich-colors class="pointer-events-auto" />
    </div>
  </main>
</template>

<style scoped>
.slide-card-enter-active,
.slide-card-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-card-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.98);
}
.slide-card-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.98);
}
</style>
