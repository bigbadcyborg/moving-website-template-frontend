import { apiRequest } from './apiClient'

export interface SalesCommission {
  id: number
  salesUserId: number
  bookingId: number
  depositAmountCents: number
  totalAmountCents?: number
  commissionAmountCents: number
  isFinal: boolean
  createdAtUtc: string
  customerName: string
  moveDate: string
  jobStatus: string
  isPaid: boolean
}

export interface SalesStats {
  totalCommissionCents: number
  pendingCommissionCents: number
  completedMovesCount: number
  pendingMovesCount: number
}

export async function getSalesCommissions(): Promise<SalesCommission[]> {
  return apiRequest('/sales/commissions')
}

export async function getSalesStats(): Promise<SalesStats> {
  return apiRequest('/sales/stats')
}
