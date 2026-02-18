<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, List, Map } from 'lucide-vue-next'
import { searchProperties, semanticSearchProperties } from '../services/property.service'
import PropertyMap from '../components/PropertyMap.vue'
import type { PropertyForMap } from '../components/PropertyMap.vue'
import { AppTitle, AppCard, AppButton, AppInput, AppPagination } from '../components/ui'
import PropertyCard from '../components/PropertyCard.vue'

const { t } = useI18n()
const router = useRouter()

const PAGE_SIZE = 12

type PropertyItem = {
  id: string
  title: string
  city: string
  price_monthly: string
  status: string
  latitude?: string | null
  longitude?: string | null
  media?: Array<{ id: string; url: string; type: string }>
}
const properties = ref<PropertyItem[]>([])
const viewMode = ref<'list' | 'map'>('list')
const loading = ref(true)
const searchText = ref('')
const aiSearchText = ref('')
const city = ref('')
const minPrice = ref('')
const maxPrice = ref('')
const useAi = ref(false)

const total = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)

async function fetchList(page = 1) {
  loading.value = true
  currentPage.value = page
  try {
    const filters = {
      q: (useAi.value ? aiSearchText.value : searchText.value) || '',
      city: city.value || undefined,
      min_price: minPrice.value || undefined,
      max_price: maxPrice.value || undefined,
      page,
      limit: PAGE_SIZE,
    }
    const result =
      useAi.value && filters.q
        ? await semanticSearchProperties(filters)
        : await searchProperties(filters)
    properties.value = result.data
    total.value = result.total
    totalPages.value = result.totalPages
  } finally {
    loading.value = false
  }
}

function search() {
  fetchList(1)
}

function onPageChange(page: number) {
  fetchList(page)
}

function onMapSelect(id: string) {
  router.push(`/property/${id}`)
}

const filtersRef = ref<HTMLElement | null>(null)

function scrollToFilters() {
  if (filtersRef.value) {
    filtersRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(fetchList)
</script>

<template>
  <main class="max-w-layout mx-auto px-4 py-4 md:px-8 md:py-8">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4 md:mb-6">
      <AppTitle :level="2" class="flex items-center gap-2">
        <Search class="w-6 h-6 text-[var(--color-accent)]" />
        {{ t('property.listTitle') }}
      </AppTitle>
      <div class="flex rounded-lg border border-gray-200 overflow-hidden">
        <AppButton
          :variant="viewMode === 'list' ? 'primary' : 'ghost'"
          size="sm"
          @click="viewMode = 'list'"
        >
          <List class="w-4 h-4" />
          {{ t('property.viewList') }}
        </AppButton>
        <AppButton
          :variant="viewMode === 'map' ? 'primary' : 'ghost'"
          size="sm"
          @click="viewMode = 'map'"
        >
          <Map class="w-4 h-4" />
          {{ t('property.viewMap') }}
        </AppButton>
      </div>
    </div>

    <div
      ref="filtersRef"
      class="-mx-4 mb-4 bg-[var(--color-bg)]/95 px-4 pb-3 pt-1 backdrop-blur md:mx-0 md:mb-6 md:bg-transparent md:px-0 md:pb-0 md:pt-0"
    >
      <AppCard class="sticky top-0 z-20">
      <AppParagraph muted small class="mb-3">{{ t('property.filters') }}</AppParagraph>
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[200px] space-y-2">
          <div class="flex gap-1 text-xs">
            <AppButton
              type="button"
              size="sm"
              :variant="!useAi ? 'primary' : 'outline'"
              @click="useAi = false"
            >
              Texte
            </AppButton>
            <AppButton
              type="button"
              size="sm"
              :variant="useAi ? 'primary' : 'outline'"
              @click="useAi = true"
            >
              IA
            </AppButton>
          </div>
          <AppInput
            :model-value="useAi ? aiSearchText : searchText"
            @update:model-value="(v) => useAi ? (aiSearchText = String(v)) : (searchText = String(v))"
            :label="useAi ? t('property.aiSearch') : t('property.searchText')"
            :placeholder="useAi ? t('property.aiSearchPlaceholder') : t('property.searchPlaceholder')"
          />
          <p v-if="useAi" class="text-[10px] text-[var(--color-muted)]">
            {{ t('property.aiSearchHint') }}
          </p>
        </div>
        <AppInput v-model="city" :label="t('property.city')" placeholder="Calavi" />
        <AppInput v-model="minPrice" type="number" :label="t('property.minPrice')" :min="0" placeholder="0" />
        <AppInput v-model="maxPrice" type="number" :label="t('property.maxPrice')" :min="0" placeholder="100000" />
        <div class="flex w-full items-center justify-between gap-2 md:w-auto">
          <div class="flex flex-1 gap-2 overflow-x-auto md:flex-none">
            <button
              v-for="category in ['Appartement', 'Villa', 'Bureau', 'Terrain']"
              :key="category"
              type="button"
              class="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
            >
              {{ category }}
            </button>
          </div>
          <AppButton
            variant="primary"
            class="shrink-0"
            @click="search"
          >
            {{ t('property.search') }}
          </AppButton>
        </div>
      </div>
    </AppCard>
    </div>

    <p v-if="loading" class="text-[var(--color-muted)]">{{ t('profile.loading') }}</p>
    <p v-else-if="!properties.length" class="text-[var(--color-muted)]">
      {{ t('property.noResults') }}
    </p>

    <template v-else>
      <PropertyMap
        v-if="viewMode === 'map'"
        :properties="(properties as PropertyForMap[])"
        @select="onMapSelect"
      />
      <template v-else>
        <ul class="grid gap-card grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))]">
          <li
            v-for="p in properties"
            :key="p.id"
            class="h-full"
          >
            <PropertyCard
              :id="p.id"
              :title="p.title"
              :city="p.city"
              :price-monthly="p.price_monthly"
              :image-url="p.media?.[0]?.url ?? null"
              variant="list"
              @click="(id) => router.push(`/property/${id}`)"
            />
          </li>
        </ul>
        <AppPagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          :limit="PAGE_SIZE"
          @page-change="onPageChange"
        />
      </template>
    </template>

    <!-- Bottom action bar (mobile) -->
    <div class="fixed inset-x-0 bottom-0 z-30 pb-4 md:hidden">
      <div class="mx-auto flex w-full max-w-layout gap-3 px-4">
        <AppButton
          variant="secondary"
          class="flex-1"
          @click="scrollToFilters"
        >
          {{ t('property.filters') }}
        </AppButton>
        <AppButton
          :variant="viewMode === 'map' ? 'primary' : 'outline'"
          class="flex-1"
          @click="viewMode = viewMode === 'map' ? 'list' : 'map'"
        >
          {{ viewMode === 'map' ? t('property.viewList') : t('property.viewMap') }}
        </AppButton>
      </div>
    </div>
  </main>
</template>
