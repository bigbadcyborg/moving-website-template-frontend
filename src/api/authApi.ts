import { apiRequest, setTokens, clearTokens } from './apiClient'
import { loginSchema } from '../lib/schema'
import { z } from 'zod'

export interface User {
  id: number
  email: string
  fullName: string
  role: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = loginSchema.parse({ email, password })
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  setTokens(response.accessToken, response.refreshToken)
  return response
}

export function logout() {
  clearTokens()
}

export async function refresh(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me')
}
