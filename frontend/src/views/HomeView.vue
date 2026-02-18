<script setup lang="ts">
/**
 * Accueil Premium : Hero carousel, Quartiers, sections reveal GSAP, cartes avec mini-carrousel et favoris, skeletons.
 */
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Search, Wallet, Building2 } from 'lucide-vue-next'
import { searchProperties, getPropertyById, type PropertyDetailDto } from '../services/property.service'
import { AppTitle, AppParagraph, AppButton, AppCard, InfiniteMarquee } from '../components/ui'
import HeroCarousel from '../components/home/HeroCarousel.vue'
import QuartiersBar from '../components/home/QuartiersBar.vue'
import PropertyCard from '../components/PropertyCard.vue'
import PropertyCardSkeleton from '../components/home/PropertyCardSkeleton.vue'
import {
  useScrollReveal,
  useHoverScale,
  useButtonHover,
  usePropertyCardHover,
  registerStaggerReveal,
} from '../composables/useAnimations'

const { t } = useI18n()
const router = useRouter()

const mainRef = ref<HTMLElement | null>(null)
const featured = ref<PropertyDetailDto[]>([])
const featuredLoading = ref(true)
const featuredError = ref('')
let staggerCleanup: (() => void) | null = null

useScrollReveal({ scope: mainRef })
useHoverScale(mainRef)
useButtonHover(mainRef)
usePropertyCardHover(mainRef)

function goSearch() {
  router.push('/property')
}

function goSaving() {
  router.push('/dashboard')
}

function goAuth() {
  router.push('/auth')
}

async function loadFeatured() {
  featuredLoading.value = true
  featuredError.value = ''
  try {
    const result = await searchProperties({ limit: 10 })
    const firstThree = result.data.slice(0, 3)
    const details = await Promise.all(firstThree.map((p) => getPropertyById(p.id)))
    featured.value = details
  } catch (e) {
    featuredError.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    featuredLoading.value = false
  }
}

function openProperty(id: string) {
  router.push(`/property/${id}`)
}

function onFavorite(_id: string) {
  // TODO: persister favoris (store ou API)
}

watch(
  () => featured.value.length,
  () => {
    nextTick(() => {
      staggerCleanup?.()
      staggerCleanup = registerStaggerReveal('#featured-cards')
    })
  }
)

onMounted(() => loadFeatured())
onUnmounted(() => {
  staggerCleanup?.()
})
</script>

<template>
  <main ref="mainRef" class="max-w-layout mx-auto px-6 md:px-8 pb-block">
    <!-- Hero plein écran + recherche -->
    <HeroCarousel />

    <!-- Quartiers -->
    <QuartiersBar />

    <!-- Bloc Pour qui / Comment ça marche (reveal) -->
    <section data-reveal class="py-section">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div class="md:col-span-1">
          <AppTitle :level="2">{{ t('home.howTitle') }}</AppTitle>
          <AppParagraph muted class="mt-2">{{ t('app.tagline') }}</AppParagraph>
        </div>
        <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AppCard padding="sm" class="h-full">
            <AppParagraph small>{{ t('home.howStep1') }}</AppParagraph>
          </AppCard>
          <AppCard padding="sm" class="h-full">
            <AppParagraph small>{{ t('home.howStep2') }}</AppParagraph>
          </AppCard>
          <AppCard padding="sm" class="h-full">
            <AppParagraph small>{{ t('home.howStep3') }}</AppParagraph>
          </AppCard>
        </div>
      </div>
    </section>

    <!-- Aujourd'hui sur Immo Bénin (reveal + stagger cartes) -->
    <section data-reveal class="py-block">
      <div class="flex items-baseline justify-between gap-2 mb-4">
        <AppTitle :level="2">{{ t('home.featuredTitle') }}</AppTitle>
        <AppButton data-btn-elastic variant="ghost" size="sm" @click="goSearch">
          {{ t('home.ctaSearch') }}
        </AppButton>
      </div>
      <AppParagraph muted small class="mb-6">{{ t('home.featuredSubtitle') }}</AppParagraph>

      <p v-if="featuredError" class="text-sm text-red-600">
        {{ t('home.featuredError') }} ({{ featuredError }})
      </p>

      <!-- Skeleton pendant le chargement -->
      <div
        v-else-if="featuredLoading"
        id="featured-cards"
        class="grid grid-cols-1 gap-card sm:grid-cols-3"
      >
        <PropertyCardSkeleton v-for="i in 3" :key="i" />
      </div>

      <p v-else-if="!featured.length" class="text-[var(--color-muted)] text-sm">
        {{ t('home.featuredEmpty') }}
      </p>

      <div v-else id="featured-cards">
        <InfiniteMarquee>
          <div
            v-for="p in featured"
            :key="p.id"
            data-reveal-item
            class="h-full w-card shrink-0"
          >
            <PropertyCard
              :id="p.id"
              :title="p.title"
              :city="p.city"
              :price-monthly="p.price_monthly"
              :image-url="p.media?.[0]?.url ?? null"
              :media="p.media ?? null"
              @click="openProperty"
              @favorite="onFavorite"
            />
          </div>
        </InfiniteMarquee>
      </div>
    </section>

    <!-- Pourquoi Immo Bénin + Parcours rapide -->
    <section data-reveal class="py-block">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <AppTitle :level="2">{{ t('home.whyTitle') }}</AppTitle>
          <ul class="space-y-2 text-sm text-[var(--color-muted)] list-none mt-4">
            <li>• {{ t('home.whyItem1') }}</li>
            <li>• {{ t('home.whyItem2') }}</li>
            <li>• {{ t('home.whyItem3') }}</li>
          </ul>
        </div>
        <AppCard>
          <p class="font-semibold text-[var(--color-text)] flex items-center gap-2 mb-2 text-base">
            <Building2 class="w-5 h-5 shrink-0 text-[var(--color-accent)]" />
            Parcours rapide
          </p>
          <AppParagraph muted small class="mb-4">
            Nouveau ? Cliquez sur « Connexion » pour créer votre compte en 2 étapes. Déjà locataire ou
            proprio ? Accédez directement à votre Tirelire et vos biens.
          </AppParagraph>
          <div class="flex flex-wrap gap-2">
            <AppButton data-btn-elastic variant="outline" size="sm" @click="goAuth">
              {{ t('nav.auth') }}
            </AppButton>
            <AppButton data-btn-elastic variant="outline" size="sm" @click="goSearch">
              {{ t('nav.search') }}
            </AppButton>
          </div>
        </AppCard>
      </div>
    </section>

    <!-- CTAs Explorer + Tirelire (reveal) -->
    <section data-reveal class="py-block flex flex-wrap gap-3 justify-center">
      <AppButton data-btn-elastic variant="primary" size="lg" @click="goSearch">
        <Search class="w-5 h-5 shrink-0" />
        {{ t('home.ctaSearch') }}
      </AppButton>
      <AppButton data-btn-elastic variant="outline" size="lg" @click="goSaving">
        <Wallet class="w-5 h-5 shrink-0" />
        {{ t('home.ctaSaving') }}
      </AppButton>
    </section>
  </main>
</template>
