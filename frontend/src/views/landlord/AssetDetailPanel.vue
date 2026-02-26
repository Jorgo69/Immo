<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  X, MapPin, Building2, LayoutGrid, Ruler, 
  Trash2, Edit3, Plus, ChevronRight, Info, 
  Layers, Settings, ShieldCheck, Zap, TrendingUp
} from 'lucide-vue-next'
import type { PropertyDetailDto } from '../../services/property.service'
import { AppButton, AppSkeleton } from '../../components/ui'

const props = defineProps<{
  asset: PropertyDetailDto | null
  loading?: boolean
  primaryImageUrl?: string
  displayName?: string
  cityName?: string
  formatPrice?: (p: string) => string
}>()

const emit = defineEmits(['close', 'edit', 'add-unit', 'edit-unit', 'delete'])

const { t, locale } = useI18n()
const activeTab = ref('overview')

const isVirtual = computed(() => (props.asset as any)?._virtual === true)
const units = computed(() => props.asset?.units ?? [])

const assetRevenue = computed(() => {
  if (!props.asset?.units) return 0
  return props.asset.units.reduce((acc, u) => {
    if (u.unit_status !== 'available' && u.is_available !== true) return acc + Number(u.price || 0)
    return acc
  }, 0)
})

const assetOccupationRate = computed(() => {
  if (!props.asset?.units || props.asset.units.length === 0) return 0
  const occupied = props.asset.units.filter(u => u.unit_status !== 'available' && u.is_available !== true).length
  return Math.round((occupied / props.asset.units.length) * 100)
})

const tabs = computed(() => {
  if (isVirtual.value) return ['overview', 'conditions']
  return ['overview', 'units', 'conditions']
})

function unitTypeLabel(type: string): string {
  if (!type) return '—'
  // Gérer Chambre_salon -> unitTypeChambre_salon
  const key = 'unitType' + type.charAt(0).toUpperCase() + type.slice(1)
  const translated = t('landlord.' + key)
  // Si non traduit, essayer de formater sans underscores pour tomber sur unitTypeChambreSalon
  if (translated === 'landlord.' + key) {
     const cleanKey = 'unitType' + type.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
     return t('landlord.' + cleanKey)
  }
  return translated
}
</script>

<template>
  <div class="h-full flex flex-col bg-white/20 dark:bg-black/40 backdrop-blur-ultra-glass border-l border-white/20 shadow-2xl relative overflow-hidden group">
    <!-- Glow Effects Internes -->
    <div class="absolute -top-[10%] -right-[10%] w-[40%] h-[30%] bg-primary-emerald/10 blur-mesh-glow rounded-full pointer-events-none" />
    <div class="absolute bottom-[5%] -left-[10%] w-[30%] h-[20%] bg-blue-500/10 blur-mesh-glow rounded-full pointer-events-none" />

    <!-- Header / Cover -->
    <header class="relative h-asset-cover flex-none overflow-hidden">
      <!-- Floating Close Button -->
      <button 
        class="absolute top-6 right-6 z-30 w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-black/40 hover:scale-110 transition-all shadow-xl"
        @click="emit('close')"
      >
        <X :size="24" />
      </button>

      <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10" />
      
      <img 
        v-if="primaryImageUrl" 
        :src="primaryImageUrl" 
        class="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s] ease-out" 
        alt="Cover"
      />
      <div v-else class="w-full h-full bg-slate-800 flex items-center justify-center">
        <Building2 :size="80" class="text-slate-700" />
      </div>

      <!-- Asset Title Info (In Cover) -->
      <div class="absolute bottom-8 left-8 right-8 z-20 space-y-3">
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-lg bg-primary-emerald/20 backdrop-blur-md border border-primary-emerald/30 text-[10px] font-black text-primary-emerald uppercase tracking-widest-xl">
            {{ isVirtual ? t('landlord.assetTypeUnit') : t('landlord.assetTypeBuilding') }}
          </span>
          <span class="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest-xl">
            {{ asset?.status ? t('landlord.status' + asset.status.charAt(0).toUpperCase() + asset.status.slice(1)) : '...' }}
          </span>
        </div>
        <h2 class="text-3xl font-black text-white tracking-tighter leading-none truncate">{{ displayName }}</h2>
        <div class="flex items-center gap-2 text-slate-300 font-bold tracking-tight">
          <MapPin :size="18" class="text-primary-emerald" />
          {{ cityName }}
        </div>
      </div>
    </header>

    <!-- Tabbed Navigation -->
    <nav class="flex px-6 pt-6 border-b border-white/10 relative z-20">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        class="relative px-6 py-4 text-sm font-black uppercase tracking-widest-xl transition-all"
        :class="activeTab === tab ? 'text-primary-emerald' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = tab"
      >
        {{ t('landlord.assetTabs.' + tab) }}
        <div v-if="activeTab === tab" class="absolute bottom-0 left-6 right-6 h-1 bg-primary-emerald rounded-full shadow-glass-primary animate-in fade-in zoom-in-50" />
      </button>
    </nav>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
      <div v-if="loading" class="space-y-8 animate-pulse">
        <AppSkeleton variant="rectangle" class="h-40 rounded-4xl" />
        <div class="grid grid-cols-2 gap-4">
          <AppSkeleton v-for="i in 4" :key="i" class="h-24 rounded-2xl" />
        </div>
      </div>

      <div v-else-if="asset" class="space-y-10 animate-in fade-in slide-in-from-right-10 duration-700">
        
        <!-- Tab: Overview -->
        <div v-if="activeTab === 'overview'" class="space-y-10">
          <!-- Summary Widgets -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-6 rounded-4xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-glass group-hover:bg-white/60 transition-colors">
              <Zap :size="20" class="text-primary-emerald mb-3" />
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{{ t('landlord.kpi.monthlyPotential') }}</p>
              <p class="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{{ formatPrice?.(String(assetRevenue)) }}</p>
            </div>
            <div class="p-6 rounded-4xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-glass transition-colors">
              <ShieldCheck :size="20" class="text-blue-500 mb-3" />
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{{ t('landlord.kpi.occupancy') }}</p>
              <p class="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{{ assetOccupationRate }}%</p>
            </div>
          </div>

          <!-- Description Section -->
          <section class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
                <Info :size="20" />
              </div>
              <h3 class="text-xs font-black uppercase tracking-widest-xl text-slate-900 dark:text-white">{{ t('landlord.assetSectionDescription') }}</h3>
            </div>
            <div class="p-6 rounded-5xl bg-white/30 dark:bg-white/[0.02] border border-white/10 text-slate-600 dark:text-slate-300 font-bold leading-relaxed tracking-tight">
              {{ asset.description?.[locale] || t('landlord.noDescription') }}
            </div>
          </section>

          <!-- Simple Features Grid -->
          <section class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Settings :size="20" />
              </div>
              <h3 class="text-xs font-black uppercase tracking-widest-xl text-slate-900 dark:text-white">{{ t('landlord.assetSectionFeatures') }}</h3>
            </div>
            <div class="grid grid-cols-2 gap-3">
               <div v-for="f in (asset as any).features || []" :key="f" class="flex items-center gap-3 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/10">
                 <div class="w-2 h-2 rounded-full bg-primary-emerald shadow-glass-primary" />
                 <span class="text-xs font-black text-slate-700 dark:text-slate-200 capitalize">{{ f }}</span>
               </div>
            </div>
          </section>
        </div>

        <!-- Tab: Units (Only if building) -->
        <div v-if="activeTab === 'units'" class="space-y-6">
          <header class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-widest-xl text-slate-900 dark:text-white">{{ t('landlord.unitsList') }}</h3>
            <AppButton variant="ghost" size="sm" class="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest text-primary-emerald" @click="emit('add-unit')">
               <Plus :size="16" class="mr-1" /> {{ t('landlord.addUnit') }}
            </AppButton>
          </header>

          <div v-if="!units.length" class="p-12 text-center rounded-6xl bg-white/20 dark:bg-white/[0.02] border border-dashed border-white/20">
            <Layers :size="48" class="mx-auto text-slate-400 mb-4 opacity-30" />
            <p class="text-sm font-black text-slate-400">{{ t('landlord.noUnits') }}</p>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="u in units" 
              :key="u.id" 
              class="group/unit p-6 rounded-4xl bg-white/40 dark:bg-white/5 border border-white/10 hover:border-primary-emerald/30 hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
              @click="emit('edit-unit', u)"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="space-y-1">
                  <p class="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{{ u.name }}</p>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ unitTypeLabel(u.ref_type?.code || u.type || '') }}</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-primary-emerald tracking-tighter">{{ formatPrice?.(String(u.price || 0)) }}</p>
                  <span class="text-[9px] font-black uppercase tracking-widest-xl" :class="u.unit_status === 'available' ? 'text-emerald-500' : 'text-rose-500'">
                    {{ u.unit_status === 'available' ? t('landlord.statusAvailable') : t('landlord.statusOccupied') }}
                  </span>
                </div>
              </div>
              
              <!-- Real Data Only (No placeholders) -->
              <div v-if="u.surface_m2 || u.floor" class="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                <div v-if="u.floor" class="flex items-center gap-1.5"><LayoutGrid :size="14" /> {{ t('common.floor') }} {{ u.floor }}</div>
                <div v-if="u.surface_m2" class="flex items-center gap-1.5"><Ruler :size="14" /> {{ u.surface_m2 }} m²</div>
              </div>

              <ChevronRight :size="18" class="absolute top-1/2 -right-10 group-hover/unit:right-4 -translate-y-1/2 text-primary-emerald transition-all duration-300" />
            </div>
          </div>
        </div>

        <!-- Tab: Conditions -->
        <div v-if="activeTab === 'conditions'" class="space-y-8">
           <div v-for="u in (isVirtual ? [asset.units?.[0] || asset] : units)" :key="(u as any).id" class="p-8 rounded-6xl bg-white/40 dark:bg-white/5 border border-white/20 shadow-glass space-y-8">
              <header class="flex items-center gap-4 border-b border-white/10 pb-6">
                <div class="w-12 h-12 rounded-[1.25rem] bg-primary-emerald/10 flex items-center justify-center text-primary-emerald">
                  <TrendingUp :size="24" />
                </div>
                <div>
                  <h4 class="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{{ isVirtual ? displayName : (u as any).name }}</h4>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ t('landlord.kpi.leaseConditions') }}</p>
                </div>
              </header>

              <div class="grid grid-cols-2 gap-6">
                 <div v-for="c in [
                   { label: 'landlord.unitPrice', value: formatPrice?.(String((u as any).price || 0)) },
                   { label: 'landlord.cautionMonths', value: ((u as any).caution_months || 0) + ' ' + t('common.months') },
                   { label: 'landlord.avanceMonths', value: ((u as any).avance_months || 0) + ' ' + t('common.months') },
                   { label: 'landlord.fraisDossier', value: formatPrice?.(String((u as any).frais_dossier || 0)) }
                 ]" :key="c.label" class="space-y-1">
                    <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{{ t(c.label) }}</p>
                    <p class="text-sm font-black text-slate-900 dark:text-white">{{ c.value }}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Sticky Footer Actions -->
    <footer class="p-8 pt-4 flex items-center justify-between bg-white/30 dark:bg-white/[0.02] backdrop-blur-3xl border-t border-white/10 relative z-30">
      <AppButton variant="ghost" size="lg" class="w-16 h-16 rounded-4xl text-rose-500 hover:bg-rose-500/10 hover:scale-110 active:scale-95 transition-all shadow-sm" @click="emit('delete')">
        <Trash2 :size="24" />
      </AppButton>
      <AppButton variant="primary" size="lg" class="flex-1 h-16 ml-4 rounded-4xl font-black text-lg tracking-tighter shadow-primary animate-pulse-hover" @click="emit('edit')">
        <Edit3 :size="20" class="mr-2" />
        {{ t('landlord.editAsset') }}
      </AppButton>
    </footer>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 10px;
}

@keyframes pulse-hover {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
  100% { transform: scale(1); }
}
.animate-pulse-hover:hover {
  animation: pulse-hover 2s infinite;
}
</style>
