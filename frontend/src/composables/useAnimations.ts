/**
 * Centralise les animations GSAP (Vue 3). ScrollTrigger pour reveal au scroll.
 * Utilise gsap.context() pour nettoyage automatique dans onUnmounted — évite les fuites mémoire.
 */
import { onMounted, onUnmounted, type Ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const DURATION = 0.4
const STAGGER = 0.08
const REVEAL_Y = 48
const EASE = 'power2.out'

export interface UseAnimationsOptions {
  /** Sélecteur ou ref du conteneur (scope pour gsap.context) */
  scope?: string | Ref<HTMLElement | null>
  /** Désactiver les animations (ex: prefers-reduced-motion) */
  disabled?: boolean
}

/**
 * Reveal au scroll : sections et cartes avec fade + rise (opacité 0→1, y: 50→0).
 * Stagger optionnel pour les enfants.
 */
export function useScrollReveal(options: UseAnimationsOptions = {}) {
  let ctx: gsap.Context | null = null

  onMounted(() => {
    if (options.disabled || typeof document === 'undefined') return

    const scope = options.scope
    const scopeEl =
      typeof scope === 'string'
        ? document.querySelector<HTMLElement>(scope)
        : scope && 'value' in scope
          ? (scope as Ref<HTMLElement | null>).value
          : undefined
    const root = scopeEl ?? document.documentElement

    ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: REVEAL_Y },
          {
            opacity: 1,
            y: 0,
            duration: DURATION,
            ease: EASE,
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        )
      })

      root.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((container) => {
        const children = container.querySelectorAll('[data-reveal-item]')
        if (!children.length) return
        gsap.fromTo(
          children,
          { opacity: 0, y: REVEAL_Y },
          {
            opacity: 1,
            y: 0,
            duration: DURATION,
            ease: EASE,
            stagger: STAGGER,
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      })
    }, scopeEl ?? undefined)
  })

  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })

  return { gsap, ScrollTrigger }
}

/**
 * Micro-interactions hover : scale subtil (1.03) sur les cartes/boutons.
 * À appeler avec un ref du conteneur pour borner les sélecteurs.
 */
export function useHoverScale(scopeRef: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | null = null

  onMounted(() => {
    if (typeof document === 'undefined') return
    const scope = scopeRef.value ?? undefined
    ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-hover-scale]').forEach((el) => {
        el.addEventListener('mouseenter', () => {
          gsap.to(el, { scale: 1.03, duration: 0.3, ease: 'power2.out' })
        })
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' })
        })
      })
    }, scope)
  })

  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })
}

/**
 * Enregistre un reveal stagger pour des éléments ajoutés dynamiquement (ex: cartes après chargement).
 * À appeler après nextTick() une fois le contenu rendu. Retourne une fonction de nettoyage.
 */
export function registerStaggerReveal(containerSelector: string) {
  const container = document.querySelector(containerSelector)
  if (!container) return () => {}
  const children = container.querySelectorAll('[data-reveal-item]')
  if (!children.length) return () => {}
  const tl = gsap.fromTo(
    children,
    { opacity: 0, y: REVEAL_Y },
    { opacity: 1, y: 0, duration: DURATION, ease: EASE, stagger: STAGGER }
  )
  const st = ScrollTrigger.create({
    trigger: container,
    start: 'top 85%',
    animation: tl,
    toggleActions: 'play none none none',
  })
  return () => {
    st.kill()
    tl.kill()
  }
}

/**
 * Animation élastique légère au survol des boutons (Explorer, Tirelire).
 */
export function useButtonHover(scopeRef: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | null = null

  onMounted(() => {
    if (typeof document === 'undefined') return
    ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-btn-elastic]').forEach((el) => {
        el.addEventListener('mouseenter', () => {
          gsap.to(el, { scale: 1.02, duration: 0.25, ease: 'elastic.out(1, 0.5)' })
        })
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { scale: 1, duration: 0.25, ease: 'power2.out' })
        })
      })
    }, scopeRef.value ?? undefined)
  })

  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })
}

/**
 * Hover avancé pour les cartes biens : zoom de l'image + CTA "Découvrir" avec rebond.
 * Requiert les attributs data-card-hover, data-card-image et data-card-cta dans le template.
 */
export function usePropertyCardHover(scopeRef: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | null = null

  onMounted(() => {
    if (typeof document === 'undefined') return

    ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-card-hover]').forEach((card) => {
        const image = card.querySelector<HTMLElement>('[data-card-image]')
        const cta = card.querySelector<HTMLElement>('[data-card-cta]')
        if (!image || !cta) return

        gsap.set(cta, { opacity: 0, scale: 0.9 })

        card.addEventListener('mouseenter', () => {
          gsap.to(image, { scale: 1.1, duration: 0.5, ease: 'power2.out' })
          gsap.to(cta, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          })
        })

        card.addEventListener('mouseleave', () => {
          gsap.to(image, { scale: 1, duration: 0.5, ease: 'power2.out' })
          gsap.to(cta, {
            opacity: 0,
            scale: 0.9,
            duration: 0.3,
            ease: 'power2.out',
          })
        })
      })
    }, scopeRef.value ?? undefined)
  })

  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })
}

export interface InfiniteMarqueeOptions {
  /** Durée d'un cycle complet (plus grande = plus lent). */
  duration?: number
  /** Mettre en pause au survol (accessibilité). */
  pauseOnHover?: boolean
}

/**
 * Carrousel horizontal infini type "marquee" — mouvement linéaire continu.
 * À utiliser avec un conteneur qui contient un élément [data-marquee-track] avec le contenu dupliqué.
 */
export function useInfiniteMarquee(scopeRef: Ref<HTMLElement | null>, options: InfiniteMarqueeOptions = {}) {
  let ctx: gsap.Context | null = null

  onMounted(() => {
    if (typeof document === 'undefined') return

    ctx = gsap.context(() => {
      const container = scopeRef.value
      if (!container) return
      const track = container.querySelector<HTMLElement>('[data-marquee-track]')
      if (!track) return

      if (!track.dataset.marqueeCloned) {
        const originals = Array.from(track.children) as HTMLElement[]
        originals.forEach((node) => {
          const clone = node.cloneNode(true) as HTMLElement
          track.appendChild(clone)
        })
        track.dataset.marqueeCloned = 'true'
      }

      gsap.set(track, { xPercent: 0 })

      const tween = gsap.to(track, {
        xPercent: -50,
        duration: options.duration ?? 30,
        ease: 'none',
        repeat: -1,
      })

      if (options.pauseOnHover) {
        container.addEventListener('mouseenter', () => tween.pause())
        container.addEventListener('mouseleave', () => tween.resume())
      }
    }, scopeRef.value ?? undefined)
  })

  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })
}

export { gsap, ScrollTrigger }
