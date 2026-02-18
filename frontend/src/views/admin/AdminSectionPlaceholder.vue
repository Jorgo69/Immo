<script setup lang="ts">
/**
 * Placeholder pour une section admin (liste à venir : users, properties, rooms, wallets, transactions, profiles).
 */
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { AppTitle, AppParagraph } from '../../components/ui'

useI18n()
const route = useRoute()

const sectionTitle = computed(() => (route.meta.title as string) ?? 'Section')
</script>

<template>
  <div class="max-w-layout">
    <AppTitle :level="2" class="mb-2">{{ sectionTitle }}</AppTitle>
    <AppParagraph muted>
      {{ $t('admin.sectionPlaceholder') }}
    </AppParagraph>
  </div>
</template>
