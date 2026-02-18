import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

const savedLocale = localStorage.getItem('immo_locale') ?? 'fr'
const initialLocale = savedLocale === 'en' ? 'en' : 'fr'

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'fr',
  messages: { fr, en },
})
