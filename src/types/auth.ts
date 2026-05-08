// User
export type User = {
  id: number
  username: string
  name: string | null
  active: boolean
  created_at: Date
}

// JWT
export interface JWTPayload {
  userId: number
  username: string
  name: string | null
  exp: number
  iat: number
}

export interface TokenPayload {
  userId: number
  username: string
  name: string | null
}

// Auth Context
export interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Auth Response
export interface CompanyAuthResponse {
  token: string
  user: User
}
