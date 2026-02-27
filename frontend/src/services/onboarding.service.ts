import { http } from './http'

export interface UpdateOnboardingDraftDto {
  first_name?: string
  last_name?: string
  email?: string
  avatar_url?: string
  role?: string
  company?: string
  ifu?: string
  rccm?: string
  preferred_zones?: string[]
  budget_min?: string
  budget_max?: string
}

export async function getOnboardingDraft() {
  const { data } = await http.get('/onboarding/draft')
  return data
}

export async function updateOnboardingDraft(payload: UpdateOnboardingDraftDto) {
  const { data } = await http.put('/onboarding/draft', payload)
  return data
}

export async function finalizeOnboarding() {
  const { data } = await http.post('/onboarding/finalize')
  return data
}
