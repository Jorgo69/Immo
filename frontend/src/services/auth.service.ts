import { http } from './http'

export interface AuthUserDto {
  id: string
  phone_number: string
  first_name?: string
  last_name?: string
  email?: string
  avatar_url?: string
  is_profile_complete?: boolean
  is_verified?: boolean
  id_card_url?: string | null
  phone_verified?: boolean
  preferred_lang: string
  role: 'tenant' | 'landlord' | 'agent' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
  profile?: { id: string; user_id: string; kyc_status: string } | null
}

export interface VerifyOtpResponse {
  token: string
  user: AuthUserDto
  is_new_user: boolean
  is_profile_complete: boolean
}

export type AuthChannel = 'email' | 'whatsapp' | 'sms'

export interface RequestOtpResponse {
  success: boolean
  available_channels: AuthChannel[]
  whatsapp_link?: string
  sent_channels?: AuthChannel[]
}

export async function requestOtp(payload: {
  phone_number: string
  email?: string
}): Promise<RequestOtpResponse> {
  const { data } = await http.post<RequestOtpResponse>('/auth/request-otp', payload)
  return data
}

export async function verifyOtp(payload: {
  phone_number: string
  code: string
  email?: string
  preferred_lang?: string
}) {
  const { data } = await http.post<VerifyOtpResponse>('/auth/verify-otp', payload)
  return data
}

/** Récupère l’utilisateur connecté (JWT). À utiliser pour rafraîchir id/role (UUID garanti côté API). */
export async function getMe(): Promise<AuthUserDto> {
  const { data } = await http.get<AuthUserDto>('/auth/me')
  return data
}

/** Complète le profil (onboarding). */
export async function updateProfile(payload: {
  first_name: string
  last_name: string
  email?: string
  avatar_url?: string
}): Promise<AuthUserDto> {
  const { data } = await http.post<AuthUserDto>('/user/profile', payload)
  return data
}

/** Met à jour les infos du compte (prénom, nom, email, rôle). */
export async function updateUser(payload: {
  first_name?: string
  last_name?: string
  email?: string
  avatar_url?: string
  role?: 'tenant' | 'landlord' | 'agent' | 'admin'
}): Promise<AuthUserDto> {
  const { data } = await http.post<AuthUserDto>('/user/update', payload)
  return data
}

/** Upload photo de profil (avatar). Retourne l’URL publique de l’image. */
export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('avatar', file)
  const { data } = await http.post<{ url: string }>('/user/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 15000,
  })
  return data
}

/** Upload pièce d'identité (KYC). Retourne l'URL du document. */
export async function uploadIdCard(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('id_card', file)
  const { data } = await http.post<{ url: string }>('/user/id-card', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 15000,
  })
  return data
}

