import { defineStore } from 'pinia'
import { ref } from 'vue'

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
      setUser(null, null, false)
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
    displayName,
    setToken,
    setLocale,
    setCurrency,
    setUser,
  }
})
