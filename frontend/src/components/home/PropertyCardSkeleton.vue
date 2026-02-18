<script setup lang="ts">
/**
 * Skeleton loader pour une carte de bien — formes grises animées (pulse), style Airbnb.
 */
</script>

<template>
  <article
    class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white animate-pulse dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
    <div class="flex min-h-card-body flex-1 flex-col justify-between gap-3 p-4">
      <div class="space-y-2">
        <div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-600" />
      </div>
      <div class="mt-1 h-4 w-1/3 rounded bg-gray-100 dark:bg-gray-600" />
    </div>
  </article>
</template>
