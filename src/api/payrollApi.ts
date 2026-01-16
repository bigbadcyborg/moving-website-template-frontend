import { apiRequest } from './apiClient'

export interface PayrollSummary {
  employeeId: number
  employeeNumber?: string
  totalHours: number
  hourlyRateCents: number
  estimatedPayCents: number
}

export interface EmployeePayrollItem {
  jobId: number
  jobDate: string | null
  customerName: string
  hoursWorked: number
  hourlyRateCents: number
  basePayCents: number
  tipAmountCents: number
  totalPayCents: number
  jobStatus: string
}

export interface AdminPayrollItem {
  id: string | number
  userId: number
  userName: string
  userType: 'sales' | 'employee'
  bookingId?: number
  jobId?: number
  customerName: string
  jobDate: string | null
  // Sales fields
  depositAmountCents?: number
  commissionAmountCents?: number
  // Employee fields
  hoursWorked?: number
  hourlyRateCents?: number
  basePayCents?: number
  tipAmountCents?: number
  totalPayCents: number
  createdAtUtc?: string
}

export async function getPayrollSummary(periodStartUtc: string, periodEndUtc: string): Promise<PayrollSummary[]> {
  return apiRequest(`/payroll/summary?periodStartUtc=${encodeURIComponent(periodStartUtc)}&periodEndUtc=${encodeURIComponent(periodEndUtc)}`)
}

export async function getEmployeePayroll(): Promise<EmployeePayrollItem[]> {
  return apiRequest('/payroll/employee')
}

export async function getAdminPayroll(userType: 'sales' | 'employee', userId?: number): Promise<AdminPayrollItem[]> {
  const params = new URLSearchParams({ userType })
  if (userId) params.append('userId', userId.toString())
  return apiRequest(`/payroll/admin?${params.toString()}`)
}
