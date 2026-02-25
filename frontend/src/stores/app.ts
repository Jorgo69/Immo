import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUserDto } from '../services/auth.service'

export const useAppStore = defineStore('app', () => {
  const token = ref<string | null>(localStorage.getItem('immo_token'))
  const locale = ref<string>(localStorage.getItem('immo_locale') ?? 'fr')
  const currency = ref<string>(localStorage.getItem('immo_currency') ?? 'XOF')
  const userId = ref<string | null>(localStorage.getItem('immo_user_id'))
  const userRole = ref<string | null>(localStorage.getItem('immo_user_role'))
  const userFirstName = ref<string | null>(localStorage.getItem('immo_user_first_name'))
  const userLastName = ref<string | null>(localStorage.getItem('immo_user_last_name'))
  const userEmail = ref<string | null>(localStorage.getItem('immo_user_email'))
  const isProfileComplete = ref<boolean>(
    localStorage.getItem('immo_is_profile_complete') === 'true',
  )

  /** Cache utilisateur courant (KYC, is_verified). Source de vérité = backend ; ce cache évite les getMe() à chaque vérification. */
  const currentUser = ref<AuthUserDto | null>(null)

  const isVerified = computed(() => currentUser.value?.is_verified === true)
  const kycStatus = computed(() => currentUser.value?.profile?.kyc_status ?? 'pending')

  /** Nom d'affichage : Prénom + Nom, ou Email si vide, jamais de placeholder générique si une donnée existe. */
  function displayName(): string {
    const first = userFirstName.value?.trim()
    const last = userLastName.value?.trim()
    if (first || last) return [first, last].filter(Boolean).join(' ').trim()
    const email = userEmail.value?.trim()
    if (email) return email
    return ''
  }

  function setToken(value: string | null) {
    token.value = value
    if (value) {
      localStorage.setItem('immo_token', value)
    } else {
      localStorage.removeItem('immo_token')
      currentUser.value = null
      setUser(null, null, false)
    }
  }

  /** Met à jour le cache utilisateur (après login ou refresh). Backend = source de vérité. */
  function setCurrentUser(user: AuthUserDto | null) {
    currentUser.value = user
    if (!user) {
      setUser(null, null, false)
      return
    }
    setUser(user.id, user.role, user.is_profile_complete, {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    })
  }

  /** Rafraîchit le cache depuis l’API (un seul getMe). À appeler au chargement de l’app si token, ou après mise à jour profil/KYC. */
  async function refreshMe(): Promise<AuthUserDto | null> {
    if (!token.value) return null
    try {
      const { getMe } = await import('../services/auth.service')
      const me = await getMe()
      setCurrentUser(me)
      return me
    } catch {
      setCurrentUser(null)
      return null
    }
  }

  function setLocale(value: string) {
    locale.value = value
    localStorage.setItem('immo_locale', value)
  }

  function setCurrency(value: string) {
    currency.value = value
    localStorage.setItem('immo_currency', value)
  }

  function setUser(
    id: string | null,
    role: string | null,
    profileComplete?: boolean,
    profile?: { first_name?: string | null; last_name?: string | null; email?: string | null },
  ) {
    userId.value = id
    userRole.value = role
    if (profileComplete !== undefined) {
      isProfileComplete.value = profileComplete
      if (profileComplete) localStorage.setItem('immo_is_profile_complete', 'true')
      else localStorage.removeItem('immo_is_profile_complete')
    }
    if (profile) {
      userFirstName.value = profile.first_name ?? null
      userLastName.value = profile.last_name ?? null
      userEmail.value = profile.email ?? null
      if (userFirstName.value != null) localStorage.setItem('immo_user_first_name', userFirstName.value)
      else localStorage.removeItem('immo_user_first_name')
      if (userLastName.value != null) localStorage.setItem('immo_user_last_name', userLastName.value)
      else localStorage.removeItem('immo_user_last_name')
      if (userEmail.value != null) localStorage.setItem('immo_user_email', userEmail.value)
      else localStorage.removeItem('immo_user_email')
    }
    if (id) localStorage.setItem('immo_user_id', id)
    else {
      localStorage.removeItem('immo_user_id')
      userFirstName.value = null
      userLastName.value = null
      userEmail.value = null
      localStorage.removeItem('immo_user_first_name')
      localStorage.removeItem('immo_user_last_name')
      localStorage.removeItem('immo_user_email')
    }
    if (role) localStorage.setItem('immo_user_role', role)
    else localStorage.removeItem('immo_user_role')
  }

  return {
    token,
    locale,
    currency,
    userId,
    userRole,
    userFirstName,
    userLastName,
    userEmail,
    isProfileComplete,
    currentUser,
    isVerified,
    kycStatus,
    displayName,
    setToken,
    setLocale,
    setCurrency,
    setUser,
    setCurrentUser,
    refreshMe,
  }
})
