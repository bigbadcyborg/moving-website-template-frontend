import { apiRequest } from './apiClient'

export interface User {
  id: number
  email: string
  fullName: string
  role: string
  isActive?: boolean
  employeeId?: number
  hourlyRateCents?: number
  employeeNumber?: string
  isManager?: boolean
}

export interface UserCreate {
  email: string
  password: string
  fullName: string
  role: string
}

export interface UserUpdate {
  role?: string
  isActive?: boolean
  fullName?: string
  hourlyRateCents?: number
}

export async function getUsers(): Promise<User[]> {
  return apiRequest('/admin/users')
}

export async function createUser(data: UserCreate): Promise<User> {
  return apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(userId: number, data: UserUpdate): Promise<User> {
  return apiRequest(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<{ id: number; email: string; message: string }> {
  return apiRequest(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  })
}

export interface CompanyConfig {
  customerDepositCents: number
  customerRescheduleFeeCents: number
  salesDepositMinCents: number
  salesDepositMaxCents: number
  salesRescheduleFeeMinCents: number
  salesRescheduleFeeMaxCents: number
  salesTripFeeMinCents: number
  salesTripFeeMaxCents: number
  salesCommissionRateBps: number
  commissionCapCents: number | null
  holdMinutes: number
  payPeriodDays: number
  notificationsEnabled: boolean
  totalTrucks: number
  bucketMinutes: number
  maxTrucksPerBooking: number | null
}

export interface CompanyConfigUpdate {
  customerDepositCents?: number
  customerRescheduleFeeCents?: number
  salesDepositMinCents?: number
  salesDepositMaxCents?: number
  salesRescheduleFeeMinCents?: number
  salesRescheduleFeeMaxCents?: number
  salesTripFeeMinCents?: number
  salesTripFeeMaxCents?: number
  salesCommissionRateBps?: number
  commissionCapCents?: number | null
  holdMinutes?: number
  payPeriodDays?: number
  notificationsEnabled?: boolean
  totalTrucks?: number
  bucketMinutes?: number
  maxTrucksPerBooking?: number | null
}

export async function getConfig(): Promise<CompanyConfig> {
  return apiRequest('/admin/config')
}

export async function updateConfig(data: CompanyConfigUpdate): Promise<CompanyConfig> {
  return apiRequest('/admin/config', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
