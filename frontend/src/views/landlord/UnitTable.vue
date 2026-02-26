<script setup lang="ts">
/**
 * Table des unités immobilières (Split-View High-End).
 * Glassmorphism, lignes translucides et typographie Bolder.
 */
import { useI18n } from 'vue-i18n'
import { MoreVertical, MapPin, ChevronRight, Droplets, Zap } from 'lucide-vue-next'
import PropertyCardImage from '../../components/landlord/PropertyCardImage.vue'
import type { UnitDto } from '../../services/property.service'

interface UnitWithProperty {
  unit: UnitDto
  propertyName: string
  propertyId: string
  ownerId: string
}

defineProps<{
  units: UnitWithProperty[]
  primaryImageUrl: (u: UnitWithProperty) => string | undefined
  formatPrice: (p: string) => string
  canManageUnit: (u: UnitWithProperty) => boolean
}>()

const emit = defineEmits([
  'view-details',
  'edit-unit',
  'delete-unit'
])

const { t } = useI18n()

function statusLabel(status: string): string {
  const key = status === 'available' ? 'statusAvailable' : 'status' + status.charAt(0).toUpperCase() + status.slice(1)
  return t('landlord.' + key)
}
</script>

<template>
  <div class="overflow-x-auto custom-scrollbar rounded-5xl bg-white/20 dark:bg-white/[0.02] backdrop-blur-ultra-glass border border-white/10 shadow-glass">
    <table class="w-full text-left border-collapse min-w-[56.25rem]">
      <thead>
        <tr class="border-b border-white/10 transition-colors">
          <th class="py-8 px-8 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">Visuel</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">Nom & Bien</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">Prix</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">Inclusions</th>
          <th class="py-8 px-6 text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">Statut</th>
          <th class="py-8 px-8 text-right text-[11px] font-black uppercase tracking-widest-2xl text-slate-500 dark:text-slate-400">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="u in units"
          :key="u.unit.id"
          class="group transition-all duration-300 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/40 dark:hover:bg-white/[0.04]"
          @click="emit('view-details', u)"
        >
          <!-- Thumbnail -->
          <td class="py-6 px-8">
            <div class="relative w-20 h-20 rounded-2xl overflow-hidden shadow-inner border border-white/10 group-hover:scale-110 transition-transform">
              <PropertyCardImage :src="primaryImageUrl(u)" class="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" alt="Asset" />
            </div>
          </td>

          <!-- Name & Property -->
          <td class="py-6 px-6">
            <div class="space-y-1">
              <p class="text-lg font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-primary-emerald transition-colors">{{ u.unit.name }}</p>
              <div class="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <MapPin :size="14" class="text-primary-emerald" />
                {{ u.propertyName }}
              </div>
            </div>
          </td>

          <!-- Price -->
          <td class="py-6 px-6">
             <p class="text-base font-black text-slate-900 dark:text-white tracking-tighter">{{ formatPrice(String(u.unit.price || 0)) }}</p>
             <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest-xl">/ MOIS</p>
          </td>

          <!-- Inclusions -->
          <td class="py-6 px-6">
            <div class="flex items-center gap-2">
               <span v-if="(u.unit as any).water_included" class="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20" title="Eau incluse">
                 <Droplets :size="14" />
               </span>
               <span v-if="(u.unit as any).electricity_included" class="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Électricité incluse">
                 <Zap :size="14" />
               </span>
            </div>
          </td>

          <!-- Status Badge -->
          <td class="py-6 px-6">
            <span 
              class="inline-flex px-4 py-1.5 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest-xl border transition-all"
              :class="(u.unit.unit_status === 'available' || u.unit.is_available)
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'"
            >
              {{ statusLabel(u.unit.unit_status || (u.unit.is_available ? 'available' : 'occupied')) }}
            </span>
          </td>

          <!-- Actions -->
          <td class="py-6 px-8 text-right relative data-grid-actions">
            <div class="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 class="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-slate-500 hover:bg-primary-emerald hover:text-white hover:scale-110 active:scale-95 transition-all shadow-sm"
                 @click.stop="emit('view-details', u)"
               >
                 <ChevronRight :size="18" />
               </button>
               <button 
                 v-if="canManageUnit(u)"
                 class="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 flex items-center justify-center text-slate-500 hover:bg-primary-emerald hover:text-white hover:scale-110 active:scale-95 transition-all shadow-sm"
                 @click.stop="emit('edit-unit', u)"
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
