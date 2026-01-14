
export interface UserSession {
  id: number
  email: string
  roleId: number | null
  teamId: number | null
  careerBandId: number | null
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVED' | 'RETIRED'
  fullName?: string
  avatarUrl?: string | null
}

export interface LoginResponse {
  user: UserSession
  token: string
}
