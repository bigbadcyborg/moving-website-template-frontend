import { apiRequest } from './apiClient'

export interface PayrollSummary {
  employeeId: number
  employeeNumber?: string
  totalHours: number
  hourlyRateCents: number
  estimatedPayCents: number
}

export async function getPayrollSummary(periodStartUtc: string, periodEndUtc: string): Promise<PayrollSummary[]> {
  return apiRequest(`/payroll/summary?periodStartUtc=${encodeURIComponent(periodStartUtc)}&periodEndUtc=${encodeURIComponent(periodEndUtc)}`)
}
