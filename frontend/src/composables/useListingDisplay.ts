/**
 * Utilitaires d'affichage pour les annonces (Vue Tenant & Landlord).
 * ARCHITECTURE §8 : logique réutilisable pour badges et images.
 */
import { getUploadUrl } from '../config/api'
import type { PropertyListItemDto, UnitDto } from '../services/property.service'

/**
 * URL de l'image principale d'un bien (is_primary ou premier media par rank).
 */
export function getPrimaryImageUrlForProperty(p: PropertyListItemDto): string | undefined {
  let raw: string | undefined
  if (p.main_image) raw = p.main_image
  else {
    const media = p.media ?? []
    const primary = media.find((m) => m.is_primary)
    if (primary?.url) raw = primary.url
    else {
      const byRank = [...media].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      raw = byRank[0]?.url
    }
  }
  return raw ? getUploadUrl(raw) : undefined
}

/**
 * True si le bien ou au moins une unité a un équipement type Parking ou Accès véhicule.
 */
export function hasVehicleAccess(p: PropertyListItemDto): boolean {
  const re = /parking|vehicle|véhicule|voiture|accès\s*véhicule/i
  const propFeatures = (p as unknown as { equipment?: string[]; features?: string[] }).equipment
    ?? (p as unknown as { equipment?: string[]; features?: string[] }).features
  if (Array.isArray(propFeatures) && propFeatures.some((x: string) => re.test(String(x)))) return true
  const units = p.units ?? []
  for (const u of units) {
    const f = u.features
    if (Array.isArray(f) && f.some((x: string) => re.test(String(x)))) return true
    if (f && typeof f === 'object' && !Array.isArray(f)) {
      const arr = (f as Record<string, string[]>).fr ?? (f as Record<string, string[]>).en ?? []
      if (arr.some((x: string) => re.test(x))) return true
    }
  }
  return false
}

/**
 * Prix total d'entrée (loyer 1er mois + caution + frais de dossier).
 */
export function totalEntryPrice(unit: UnitDto): number {
  const rent = Number(unit.price ?? 0)
  const cautionMonths = unit.caution_months ?? 0
  const frais = Number(unit.frais_dossier ?? 0)
  return rent + cautionMonths * rent + frais
}
