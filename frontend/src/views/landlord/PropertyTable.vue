<script setup lang="ts">
/**
 * Table des biens immobiliers (Split-View High-End).
 * Glassmorphism, lignes translucides et typographie Bolder.
 * Utilise les Design Tokens officiels.
 */
import { useI18n } from 'vue-i18n'
import { MoreVertical, MapPin, Users, ChevronRight } from 'lucide-vue-next'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'
import type { PropertyListItemDto } from '../../services/property.service'

defineProps<{
  properties: PropertyListItemDto[]
  primaryImageUrl: (p: PropertyListItemDto) => string | undefined
  displayName: (p: PropertyListItemDto) => string
  cityDisplay: (p: PropertyListItemDto) => string
  statusLabel: (status: string) => string
  formatPrice: (p: string) => string
  selectedId: string | null
}>()

const emit = defineEmits([
  'select-property',
  'select-property-units',
  'view-details',
  'add-unit',
  'quick-edit',
  'edit-property'
])

const { t } = useI18n()

function unitCount(p: PropertyListItemDto): number {
  return p.units?.length ?? 0
}

function occupiedCount(p: PropertyListItemDto): number {
  return (p.units ?? []).filter((u: any) => u.unit_status !== 'available' && u.is_available !== true).length
}

function occupancyPercent(p: PropertyListItemDto): number {
  const total = unitCount(p)
  return total === 0 ? 0 : Math.round((occupiedCount(p) / total) * 100)
}
</script>

<template>
  <div class="overflow-x-auto custom-scrollbar rounded-5xl bg-white/20 dark:bg-white/[0.02] backdrop-blur-ultra-glass border border-white/10 shadow-glass">
    <table class="w-full text-left border-collapse min-w-[56.25rem]">
      <thead>
        <tr class="border-b border-white/10 transition-colors">
          <th class="py-8 px-8 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">{{ t('landlord.assets.thumbnail') }}</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">{{ t('landlord.assets.name') }}</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">{{ t('landlord.assets.units') }}</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">{{ t('landlord.assets.revenue') }}</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">{{ t('landlord.assets.status') }}</th>
          <th class="py-8 px-8 text-right text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">{{ t('landlord.assets.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in properties"
          :key="p.id"
          class="group transition-all duration-300 border-b border-white/5 last:border-0 cursor-pointer"
          :class="selectedId === p.id ? 'bg-primary-emerald/10 shadow-inner' : 'hover:bg-white/40 dark:hover:bg-white/[0.04]'"
          @click="emit('select-property', p)"
        >
          <!-- Thumbnail -->
          <td class="py-6 px-8">
            <div class="relative w-20 h-20 rounded-2xl overflow-hidden shadow-inner border border-white/10 group-hover:scale-110 transition-transform">
              <PropertyCardImage :src="primaryImageUrl(p)" class="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" alt="Asset" />
              <div v-if="(p as any)._virtual" class="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                 <span class="text-[8px] font-black uppercase text-amber-200 backdrop-blur-sm bg-black/40 px-2 py-0.5 rounded-full ring-1 ring-white/20">UNIT</span>
              </div>
            </div>
          </td>

          <!-- Name & Location -->
          <td class="py-6 px-6">
            <div class="space-y-1">
              <p class="text-lg font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-primary-emerald transition-colors">{{ displayName(p) }}</p>
              <div class="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <MapPin :size="14" class="text-primary-emerald" />
                {{ cityDisplay(p) }}
              </div>
            </div>
          </td>

          <!-- Units Stats -->
          <td class="py-6 px-6">
            <div class="space-y-2 max-w-32">
              <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest-xl text-slate-500">
                <span class="flex items-center gap-1"><Users :size="12" /> {{ unitCount(p) }}</span>
                <span>{{ occupancyPercent(p) }}%</span>
              </div>
              <div class="h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                <div class="h-full bg-primary-emerald shadow-glass-primary transition-all duration-1000" :style="{ width: occupancyPercent(p) + '%' }" />
              </div>
            </div>
          </td>

          <!-- Revenue -->
          <td class="py-6 px-6">
            <div class="space-y-1">
              <p class="text-base font-black text-slate-900 dark:text-white tracking-tighter">{{ formatPrice(String((p as any).revenue || 0)) }}</p>
              <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest-xl">{{ t('landlord.kpi.estMonthly') }}</p>
            </div>
          </td>

          <!-- Status Badge -->
          <td class="py-6 px-6">
            <span 
              class="inline-flex px-4 py-1.5 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest-xl border transition-all"
              :class="p.status === 'available' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'"
            >
              {{ statusLabel(p.status) }}
            </span>
          </td>

          <!-- Actions -->
          <td class="py-6 px-8 text-right">
            <div class="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 class="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-slate-500 hover:bg-primary-emerald hover:text-white hover:scale-110 active:scale-95 transition-all shadow-sm"
                 @click.stop="emit('view-details', p)"
                 :title="t('landlord.assets.viewDetails')"
               >
                 <ChevronRight :size="18" />
               </button>
               <button 
                 class="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-slate-500 hover:bg-primary-emerald hover:text-white hover:scale-110 active:scale-95 transition-all shadow-sm"
                 @click.stop="emit('quick-edit', p)"
               >
                 <MoreVertical :size="18" />
               </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 10px;
}
</style>
