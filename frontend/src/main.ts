import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n'
import { router } from './router'
import App from './App.vue'
import './style.css'

// Appliquer le thème (dark mode) dès le chargement pour éviter le flash.
const savedTheme = localStorage.getItem('immo_theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

// Enregistrement du Service Worker (PWA)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount('#app')
