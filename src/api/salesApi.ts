import { apiRequest } from './apiClient'

export interface SalesCommission {
  id: number
  bookingId: number
  jobId: number
  customerName: string
  moveDate: string | null
  depositAmountCents: number
  commissionAmountCents: number
  jobStatus: string
  createdAtUtc: string
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
