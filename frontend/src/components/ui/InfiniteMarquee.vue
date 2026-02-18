<script setup lang="ts">
import { ref } from 'vue'
import { useInfiniteMarquee } from '../../composables/useAnimations'

const rootRef = ref<HTMLElement | null>(null)

useInfiniteMarquee(rootRef, {
  duration: 35,
  pauseOnHover: true,
})
</script>

<template>
  <section
    ref="rootRef"
    class="relative overflow-hidden"
  >
    <div
      data-marquee-track
      class="flex flex-nowrap items-stretch gap-card"
    >
      <slot />
    </div>
  </section>
</template>

