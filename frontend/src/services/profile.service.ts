import { http } from './http'

export interface ProfileDto {
  id: string
  user_id: string
  full_name: string | null
  id_card: string | null
  kyc_status: string
}

export async function getMyProfile() {
  const { data } = await http.get<ProfileDto | null>('/profile/me')
  return data
}

export async function updateMyProfile(payload: { full_name?: string; id_card?: string }) {
  const { data } = await http.put<ProfileDto>('/profile/me', payload)
  return data
}

