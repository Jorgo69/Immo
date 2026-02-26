<script setup lang="ts">
import { useCurrency } from '../composables/useCurrency'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MapPin, ChevronUp, ChevronDown, Play } from 'lucide-vue-next'
import { getUploadUrl } from '../config/api'
import {
  searchProperties,
  getPropertyById,
  type PropertyDetailDto,
  type PropertyListItemDto,
  type UnitDto,
} from '../services/property.service'
import { getApiErrorMessage } from '../services/http'
import { toast } from 'vue-sonner'
import { AppTitle, AppParagraph, AppButton } from '../components/ui'

const { t } = useI18n()
const router = useRouter()

type RoomReel = { room: UnitDto; property: PropertyDetailDto }

const reels = ref<RoomReel[]>([])
const currentIndex = ref(0)
const loadingList = ref(true)
const error = ref('')

const current = computed<RoomReel | null>(() => reels.value[currentIndex.value] ?? null)
const hasMedia = computed(() => !!current.value?.property.media?.length)
const heroImage = computed(() => getUploadUrl(current.value?.property.media?.[0]?.url ?? ''))

async function loadList() {
  loadingList.value = true
  error.value = ''
  try {
    const result = await searchProperties({ limit: 100 })
    const details = await Promise.all(
      result.data.map((p: PropertyListItemDto) => getPropertyById(p.id)),
    )
    const nextReels: RoomReel[] = []
    for (const detail of details) {
      const units = detail.units ?? detail.rooms ?? []
      if (units.length) {
        for (const room of units) {
          nextReels.push({ room: room as UnitDto, property: detail })
        }
      } else {
        const price = detail.price_monthly ?? detail.units?.[0]?.price ?? '0'
        nextReels.push({
          room: {
            id: detail.id,
            property_id: detail.id,
            name: detail.name ?? detail.title ?? '',
            type: 'studio',
            price,
            description: null,
            features: [],
            images: [],
            is_available: true,
            surface_m2: null,
            floor: null,
          },
          property: detail,
        })
      }
    }
    reels.value = nextReels
    currentIndex.value = 0
  } catch (e) {
    const msg = getApiErrorMessage(e)
    toast.error(msg)
    error.value = msg
  } finally {
    loadingList.value = false
  }
}

const { formatPrice: formatPriceC } = useCurrency()
function formatPrice(val: any) {
  if (!val && val !== 0) return formatPriceC(0)
  const v = Number(val)
  return isNaN(v) ? formatPriceC(0) : formatPriceC(v)
}

function next() {
  if (currentIndex.value < reels.value.length - 1) currentIndex.value += 1
}

function prev() {
  if (currentIndex.value > 0) currentIndex.value -= 1
}

function openDetail() {
  if (current.value) router.push(`/property/${current.value.property.id}`)
}

onMounted(loadList)
</script>

<template>
  <main class="max-w-layout mx-auto px-6 md:px-8 py-4 md:py-8 min-h-[calc(100vh-3.5rem)] flex flex-col">
    <header class="mb-4 flex items-center justify-between gap-3">
      <div>
        <AppTitle :level="2">{{ t('reels.title') }}</AppTitle>
        <AppParagraph muted small>{{ t('reels.subtitle') }}</AppParagraph>
      </div>
      <span v-if="reels.length" class="text-xs text-[var(--color-muted)]">
        {{ currentIndex + 1 }} / {{ reels.length }}
      </span>
    </header>

    <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>
    <p v-else-if="loadingList" class="text-[var(--color-muted)] mb-4">
      {{ t('reels.loading') }}
    </p>
    <p v-else-if="!reels.length" class="text-[var(--color-muted)] mb-4">
      {{ t('reels.empty') }}
    </p>

    <section v-if="reels.length && current" class="flex-1 flex flex-col items-stretch justify-center">
      <div
        class="relative w-full max-w-md mx-auto aspect-[9/16] rounded-3xl overflow-hidden border border-gray-200 bg-black text-white shadow-md"
      >
        <div
          class="absolute inset-0 bg-cover bg-center"
          :style="hasMedia && heroImage ? { backgroundImage: `url(${heroImage})` } : {}"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        <div class="absolute top-3 left-3 right-3 flex items-center justify-between text-xs">
          <span class="px-2 py-1 rounded-full bg-black/40 border border-white/10">
            {{ t('reels.badge') }}
          </span>
          <span class="px-2 py-1 rounded-full bg-black/40 border border-white/10">
            {{ currentIndex + 1 }} / {{ reels.length }}
          </span>
        </div>

        <div class="absolute bottom-16 left-4 right-4 space-y-2">
          <h2 class="text-base md:text-lg font-semibold leading-snug line-clamp-2">
            {{ current.room.name }}
          </h2>
          <p class="flex items-center gap-1 text-xs text-gray-200">
            <MapPin class="w-3 h-3 shrink-0" />
            <span>{{ typeof current.property.city === 'string' ? current.property.city : current.property.city?.name ?? '' }}</span>
          </p>
          <p class="text-sm font-semibold text-[var(--color-accent)]">
            <span>{{ formatPrice(current.room.price ?? current.room.price_monthly ?? current.property.price_monthly ?? current.property.units?.[0]?.price ?? '0') }}</span>
            <span class="text-xs text-gray-200"> {{ t('property.perMonth') }}</span>
          </p>
          <p
            v-if="current.room.description || (current.room as { description_translations?: { fr?: string } }).description_translations?.fr || current.property.description_translations?.fr"
            class="text-xs text-gray-100 line-clamp-3"
          >
            {{ current.room.description ?? (current.room as { description_translations?: { fr?: string } }).description_translations?.fr ?? current.property.description_translations?.fr }}
          </p>
        </div>

        <AppButton
          type="button"
          variant="primary"
          class="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 py-2 rounded-full bg-white/90 text-[var(--color-text)]"
          @click="openDetail"
        >
          <Play class="w-4 h-4" />
          {{ t('reels.cta') }}
        </AppButton>
      </div>

      <div class="mt-4 flex items-center justify-center gap-4">
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          :disabled="currentIndex === 0"
          @click="prev"
        >
          <ChevronUp class="w-4 h-4" />
          {{ t('reels.prev') }}
        </AppButton>
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          :disabled="currentIndex >= reels.length - 1"
          @click="next"
        >
          <ChevronDown class="w-4 h-4" />
          {{ t('reels.next') }}
        </AppButton>
      </div>
    </section>
  </main>
</template>
