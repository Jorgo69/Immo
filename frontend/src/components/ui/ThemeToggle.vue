<script setup lang="ts">
/**
 * Bascule thème clair / sombre. Icône Soleil en mode sombre (cliquer pour passer en clair), Lune en mode clair (cliquer pour passer en sombre).
 */
import { useI18n } from 'vue-i18n'
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '../../composables/useTheme'
import AppButton from './AppButton.vue'

const { t } = useI18n()
const { isDark, toggle } = useTheme()
</script>

<template>
  <AppButton
    type="button"
    variant="ghost"
    size="sm"
    :aria-label="isDark ? t('nav.themeLight') : t('nav.themeDark')"
    class="rounded-full p-2 text-[var(--color-muted)] hover:text-[var(--color-text)] dark:text-gray-400 dark:hover:text-gray-100"
    @click="toggle"
  >
    <Sun v-if="isDark" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </AppButton>
</template>
