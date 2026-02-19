<script setup lang="ts">
/**
 * Barre de navigation basse (mobile only) avec 5 entrées cohérentes avec le desktop :
 * - Accueil
 * - Explorer (biens)
 * - IA (centre, mise en avant)
 * - Découvrir (Reels)
 * - Profil / Connexion (selon le statut)
 */
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Home, Search, Sparkles, Play, User } from 'lucide-vue-next'
import gsap from 'gsap'
import { useAppStore } from '../../stores/app'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const containerRef = ref<HTMLElement | null>(null)
const pillRef = ref<HTMLElement | null>(null)
const itemRefs = ref<(HTMLElement | null)[]>([])

type NavKey = 'home' | 'explorer' | 'ai' | 'reels' | 'profile' | 'auth'

interface NavItem {
  key: NavKey
  icon: any
  path: string
  query?: Record<string, string>
  isCenter?: boolean
}

const navItems = computed<NavItem[]>(() => {
  const loggedIn = !!appStore.token

  const base: NavItem[] = [
    { key: 'home', icon: Home, path: '/' },
    { key: 'explorer', icon: Search, path: '/property' },
    { key: 'ai', icon: Sparkles, path: '/property', query: { view: 'ai' }, isCenter: true },
    { key: 'reels', icon: Play, path: '/reels' },
    loggedIn
      ? { key: 'profile', icon: User, path: '/profile' }
      : { key: 'auth', icon: User, path: '/auth' },
  ]

  return base
})

function isItemActive(item: NavItem): boolean {
  if (item.key === 'home') {
    return route.name === 'home' || route.path === '/'
  }
  if (item.key === 'explorer') {
    if (!route.path.startsWith('/property')) return false
    // Vue liste / carte / favoris gérés dans la page elle-même
    return route.name === 'property-list' || route.path === '/property'
  }
  if (item.key === 'ai') {
    return route.path.startsWith('/property') && route.query.view === 'ai'
  }
  if (item.key === 'reels') {
    return route.name === 'reels'
  }
  if (item.key === 'profile') {
    return (
      route.path.startsWith('/profile') ||
      route.name === 'dashboard' ||
      route.path.startsWith('/admin')
    )
  }
  if (item.key === 'auth') {
    return route.name === 'auth'
  }
  return false
}

const activeIndex = computed(() => {
  const items = navItems.value
  for (let i = 0; i < items.length; i++) {
    if (isItemActive(items[i])) return i
  }
  // Fallback : si on est sur une page propriété, on met Explorer actif
  if (route.path.startsWith('/property')) return 1
  return 0
})

function goTo(item: NavItem) {
  router.push({ path: item.path, query: item.query })
}

function onClickItem(el: HTMLElement | null) {
  if (!el) return
  gsap.fromTo(el, { scale: 1.2 }, { scale: 1, duration: 0.35, ease: 'back.out(1.2)' })
}

function updatePill() {
  nextTick(() => {
    const container = containerRef.value
    const pill = pillRef.value
    const refs = itemRefs.value
    const items = navItems.value
    if (!container || !pill || refs.length < items.length) return
    const active = refs[activeIndex.value]
    if (!active) return
    const cr = container.getBoundingClientRect()
    const ar = active.getBoundingClientRect()
    const left = ar.left - cr.left + container.scrollLeft
    const width = ar.width
    gsap.to(pill, {
      left: `${left}px`,
      width: `${width}px`,
      duration: 0.35,
      ease: 'power2.inOut',
      overwrite: true,
    })
  })
}

onMounted(() => {
  nextTick(updatePill)
})

watch(activeIndex, updatePill)
watch(
  () => route.fullPath,
  () => nextTick(updatePill),
)
</script>

<template>
  <!-- Wrapper pointer-events-none : les clics passent à travers les coins ; la barre elle-même reçoit les clics. -->
  <div class="pointer-events-none fixed bottom-4 left-4 right-4 z-50 lg:hidden">
    <nav
      ref="containerRef"
      class="pointer-events-auto relative flex items-center justify-around rounded-3xl border border-white/20 bg-white/70 px-2 py-2 shadow-2xl backdrop-blur-lg dark:border-white/10 dark:bg-black/70"
      aria-label="Navigation principale"
    >
      <!-- Pastille animée derrière l'élément actif -->
      <div
        ref="pillRef"
        class="absolute top-1/2 h-10 w-10 -translate-y-1/2 rounded-2xl bg-[var(--color-accent)]/15 dark:bg-[var(--color-accent)]/25"
        style="left: 0; width: 48px;"
        aria-hidden="true"
      />

      <template v-for="(item, index) in navItems" :key="item.key">
        <button
          :ref="(el) => { itemRefs[index] = el as HTMLElement }"
          type="button"
          class="relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          :class="isItemActive(item) ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'"
          :aria-label="t(`nav.${item.key}`)"
          :aria-current="isItemActive(item) ? 'page' : undefined"
          @click="(e) => { goTo(item); onClickItem(e.currentTarget as HTMLElement) }"
        >
          <span
            v-if="item.isCenter"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
          </span>
          <component
            v-else
            :is="item.icon"
            class="h-6 w-6 shrink-0 transition-transform"
          />
          <span class="text-[10px] font-medium leading-tight">
            {{ t(`nav.${item.key}`) }}
          </span>
        </button>
      </template>
    </nav>
  </div>
</template>
