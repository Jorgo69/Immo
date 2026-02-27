<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAllConfigs, updateConfig } from '../../services/settings.service'
import type { SystemConfigDto } from '../../services/settings.service'
import { getApiErrorMessage } from '../../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppCard, AppParagraph, AppButton } from '../../components/ui'
import { Settings2, Save, ShieldAlert, ToggleLeft, ToggleRight, MessageSquare, RefreshCw, HandCoins } from 'lucide-vue-next'

const loading = ref(true)
const saving = ref<Record<string, boolean>>({})
const error = ref('')
const configs = ref<SystemConfigDto[]>([])

// Catégorisation intelligente des configs
const groupedConfigs = computed(() => {
  const groups: Record<string, SystemConfigDto[]> = {
    notifications: [],
    system: [],
    business: [],
    other: [],
  }

  configs.value.forEach((c) => {
    if (c.key.startsWith('enable_')) groups.notifications.push(c)
    else if (c.key.includes('days_')) groups.system.push(c)
    else if (c.key.includes('maintenance')) groups.system.push(c)
    else if (c.key.includes('kyc') || c.key.includes('tax')) groups.business.push(c)
    else groups.other.push(c)
  })

  return groups
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    configs.value = await getAllConfigs()
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg
  } finally {
    loading.value = false
  }
}

async function handleUpdate(config: SystemConfigDto, newValue: string) {
  saving.value[config.key] = true
  try {
    const updated = await updateConfig(config.key, newValue)
    const idx = configs.value.findIndex((c) => c.key === config.key)
    if (idx !== -1) configs.value[idx] = updated
    toast.success(`Réglage '${config.key}' mis à jour !`)
  } catch (e) {
    toast.error(getApiErrorMessage(e))
    // Rollback visuel
    await load()
  } finally {
    saving.value[config.key] = false
  }
}

function toggleBoolean(config: SystemConfigDto) {
  const newValue = config.value === 'true' ? 'false' : 'true'
  handleUpdate(config, newValue)
}

function getIconForGroup(groupName: string) {
  switch (groupName) {
    case 'notifications': return MessageSquare
    case 'system': return ShieldAlert
    case 'business': return HandCoins
    default: return Settings2
  }
}

function getGroupTitle(groupName: string) {
  switch (groupName) {
    case 'notifications': return 'Canaux de Communication'
    case 'system': return 'Système & Sécurité'
    case 'business': return 'Règles Métier'
    default: return 'Autres réglages'
  }
}

onMounted(() => load())
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-sm">
          <Settings2 class="h-6 w-6" />
        </div>
        <div>
          <AppTitle :level="2" class="mb-1">Paramètres Globaux</AppTitle>
          <AppParagraph muted class="text-sm">
            Configurez les règles métier, la communication et la maintenance du système.
          </AppParagraph>
        </div>
      </div>
      <AppButton variant="outline" size="sm" @click="load" :loading="loading" class="rounded-xl border-gray-200">
        <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
        Rafraîchir
      </AppButton>
    </div>

    <AppCard v-if="error" class="p-4 text-red-600 bg-red-50 border-red-100 rounded-2xl">
      {{ error }}
    </AppCard>

    <div v-if="loading && !configs.length" class="py-12 text-center text-[var(--color-muted)]">
      Chargement des paramètres...
    </div>

    <template v-else>
      <div v-for="(group, groupKey) in groupedConfigs" :key="groupKey">
        <div v-if="group.length > 0" class="mb-6">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
            <component :is="getIconForGroup(groupKey)" class="w-5 h-5 text-[var(--color-muted)]" />
            {{ getGroupTitle(groupKey) }}
          </h3>
          
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div 
              v-for="config in group" 
              :key="config.key"
              class="relative flex flex-col justify-between p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-[var(--color-accent)]/50 transition-colors shadow-sm"
              :class="{ 'opacity-70 pointer-events-none': saving[config.key] }"
            >
              <div class="mb-4">
                <div class="flex items-start justify-between">
                  <span class="font-mono text-xs font-semibold tracking-wider text-[var(--color-accent)] uppercase mb-1 drop-shadow-sm">
                    {{ config.key }}
                  </span>
                  <span v-if="config.is_public" class="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                    Public
                  </span>
                </div>
                <p class="text-sm text-[var(--color-text)] font-medium leading-snug">
                  {{ config.description || config.key }}
                </p>
              </div>

              <!-- Switch pour les Boolean -->
              <div v-if="config.type === 'boolean'" class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                <span class="text-xs font-medium text-[var(--color-muted)]">
                  {{ config.value === 'true' ? 'Activé' : 'Désactivé' }}
                </span>
                <button 
                  @click="toggleBoolean(config)"
                  class="transition-transform active:scale-95 focus:outline-none"
                  :class="config.value === 'true' ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'"
                >
                  <component :is="config.value === 'true' ? ToggleRight : ToggleLeft" class="w-10 h-10" />
                </button>
              </div>

              <!-- Input text/number pour les autres types -->
              <div v-else class="flex items-end gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                <div class="flex-1">
                  <input
                    :type="config.type === 'number' ? 'number' : 'text'"
                    v-model="config.value"
                    class="w-full text-sm font-semibold bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-shadow"
                    @keyup.enter="handleUpdate(config, config.value)"
                  />
                </div>
                <AppButton 
                  size="sm" 
                  variant="primary" 
                  class="rounded-lg px-3"
                  @click="handleUpdate(config, config.value)"
                  :loading="saving[config.key]"
                >
                  <Save class="w-4 h-4" />
                </AppButton>
              </div>

            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
