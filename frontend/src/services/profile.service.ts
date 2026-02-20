import { http } from './http'

/** Réponse API : champs sensibles masqués (********), jamais en clair. */
export interface ProfileDto {
  id: string
  user_id: string
  full_name_masked: string | null
  id_card_masked: string | null
  profession_masked: string | null
  company_masked: string | null
  emergency_contact_masked: string | null
  kyc_status: string
}

export async function getMyProfile() {
  const { data } = await http.get<ProfileDto | null>('/profile/me')
  return data
}

export async function updateMyProfile(payload: {
  full_name?: string
  id_card?: string
  profession?: string
  company?: string
  emergency_contact?: string
  preferred_zone?: string
  budget_min?: string
  budget_max?: string
}) {
  const { data } = await http.put<ProfileDto>('/profile/me', payload)
  return data
}

/** Méthode de paiement (affichage masqué uniquement) */
export interface PaymentMethodDto {
  id: string
  type: 'card' | 'mobile_money'
  last4_display: string
  brand_display: string
}

export async function getMyPaymentMethods(): Promise<PaymentMethodDto[]> {
  const { data } = await http.get<PaymentMethodDto[]>('/profile/payment-methods')
  return data ?? []
}

export async function addPaymentMethod(payload: {
  type: 'card' | 'mobile_money'
  gateway_token: string
  last4?: string
  brand?: string
}): Promise<PaymentMethodDto> {
  const { data } = await http.post<PaymentMethodDto>('/profile/payment-methods', payload)
  return data
}

