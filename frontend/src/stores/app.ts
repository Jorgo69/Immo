import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const token = ref<string | null>(localStorage.getItem('immo_token'))
  const locale = ref<string>(localStorage.getItem('immo_locale') ?? 'fr')
  const currency = ref<string>(localStorage.getItem('immo_currency') ?? 'XOF')
  const userId = ref<string | null>(localStorage.getItem('immo_user_id'))
  const userRole = ref<string | null>(localStorage.getItem('immo_user_role'))

  function setToken(value: string | null) {
    token.value = value
    if (value) {
      localStorage.setItem('immo_token', value)
    } else {
      localStorage.removeItem('immo_token')
      // Si on supprime le token, on nettoie aussi les infos user
      setUser(null, null)
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

  function setUser(id: string | null, role: string | null) {
    userId.value = id
    userRole.value = role
    if (id) localStorage.setItem('immo_user_id', id)
    else localStorage.removeItem('immo_user_id')
    if (role) localStorage.setItem('immo_user_role', role)
    else localStorage.removeItem('immo_user_role')
  }

  return { token, locale, currency, userId, userRole, setToken, setLocale, setCurrency, setUser }
})
