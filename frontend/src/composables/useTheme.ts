/**
 * Gestion du thème clair/sombre (Dark Mode). Stratégie 'class' Tailwind.
 * Persiste le choix dans localStorage (immo_theme).
 */
import { ref, computed, watch, onMounted } from 'vue'

const STORAGE_KEY = 'immo_theme'
export type Theme = 'light' | 'dark'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function useTheme() {
  const theme = ref<Theme>(getStoredTheme())

  function setTheme(value: Theme) {
    theme.value = value
    localStorage.setItem(STORAGE_KEY, value)
    applyTheme(value)
  }

  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  }, { immediate: false })

  onMounted(() => {
    applyTheme(theme.value)
  })

  const isDark = computed(() => theme.value === 'dark')
  return { theme, setTheme, toggle, isDark }
}
