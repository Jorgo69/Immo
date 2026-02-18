import { http } from './http'

export interface AuthUserDto {
  id: string
  phone_number: string
  preferred_lang: string
  role: 'tenant' | 'landlord' | 'agent' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VerifyOtpResponse {
  token: string
  user: AuthUserDto
}

export async function requestOtp(phone_number: string) {
  return http.post('/auth/request-otp', { phone_number })
}

export async function verifyOtp(payload: { phone_number: string; code: string }) {
  const { data } = await http.post<VerifyOtpResponse>('/auth/verify-otp', payload)
  return data
}

/** Récupère l’utilisateur connecté (JWT). À utiliser pour rafraîchir id/role (UUID garanti côté API). */
export async function getMe(): Promise<AuthUserDto> {
  const { data } = await http.get<AuthUserDto>('/auth/me')
  return data
}

