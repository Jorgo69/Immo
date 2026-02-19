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
  preferred_lang: string
  role: 'tenant' | 'landlord' | 'agent' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
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

