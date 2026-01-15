import { apiRequest } from './apiClient'

export interface AvailabilitySlot {
  id: number
  startUtc: string
  endUtc: string
  capacity: number
  remainingCapacity: number
}

export interface AvailabilityByDay {
  date: string // YYYY-MM-DD
  slots: AvailabilitySlot[]
}

export interface AvailabilityRequest {
  id: number
  customerUserId: number
  requestedStartUtc: string
  requestedEndUtc: string
  requestedCapacity: number
  status: string
  notes?: string
  adminNotes?: string
  approvedByUserId?: number
  createdAtUtc: string
  updatedAtUtc: string
}

export interface AvailabilityRequestCreate {
  requestedStartUtc: string
  requestedEndUtc: string
  requestedCapacity: number
  notes?: string
}

export async function getAvailability(fromUtc: string, toUtc: string): Promise<AvailabilitySlot[]> {
  return apiRequest(`/availability?fromUtc=${encodeURIComponent(fromUtc)}&toUtc=${encodeURIComponent(toUtc)}`)
}

export async function getAvailabilityByDay(fromUtc: string, toUtc: string): Promise<AvailabilityByDay[]> {
  return apiRequest(`/availability/by-day?fromUtc=${encodeURIComponent(fromUtc)}&toUtc=${encodeURIComponent(toUtc)}`)
}

export async function createAvailabilityRequest(data: AvailabilityRequestCreate): Promise<AvailabilityRequest> {
  return apiRequest('/availability/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getAvailabilityRequests(status?: string): Promise<AvailabilityRequest[]> {
  const url = status 
    ? `/admin/availability-requests?status=${encodeURIComponent(status)}`
    : '/admin/availability-requests'
  return apiRequest(url)
}

export async function updateAvailabilityRequest(
  requestId: number,
  data: { status: string; adminNotes?: string; capacity?: number }
): Promise<AvailabilityRequest> {
  return apiRequest(`/admin/availability-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
