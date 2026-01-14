/**
 * User Management Types
 * Định nghĩa các type cho User API
 */

export interface UserProfile {
  fullName: string
  dob?: string | null
  gender?: string | null
  idCardNumber?: string | null
  address?: string | null
  joinDate?: string | null
  unionJoinDate?: string | null
  unionPosition?: string | null
  avatarUrl?: string | null
}

export interface UserResponse {
  id: number
  employeeCode: string
  email: string
  phone?: string | null
  roleId?: number | null
  teamId?: number | null
  careerBandId?: number | null
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVED' | 'RETIRED'
  createdAt: Date
  updatedAt: Date
  profile?: UserProfile
}

export interface CreateUserInput {
  employeeCode: string
  email: string
  phone?: string
  password: string
  roleId?: number
  teamId?: number
  careerBandId?: number
  profile: {
    fullName: string
    dob?: string
    gender?: string
    idCardNumber?: string
    address?: string
    joinDate?: string
    unionJoinDate?: string
    unionPosition?: string
    avatarUrl?: string
  }
}

export interface UpdateUserInput {
  email?: string
  phone?: string
  roleId?: number
  teamId?: number
  careerBandId?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVED' | 'RETIRED'
  profile?: Partial<UserProfile>
}

export interface VerifyAccountInput {
  token: string
}

export interface VerifyAccountResponse {
  success: boolean
  message: string
}

export interface ListUsersParams {
  page?: number
  limit?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVED' | 'RETIRED'
  teamId?: number
  roleId?: number
  search?: string // Search by email, employeeCode, or name
}

export interface ListUsersResponse {
  users: Array<UserResponse>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
