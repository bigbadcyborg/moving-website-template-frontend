import { apiRequest } from './apiClient'

export interface Notification {
  id: number
  bookingId?: number
  jobId?: number
  type: string
  template: string
  status: string
  createdAtUtc: string
}

export async function getNotifications(bookingId?: number, jobId?: number): Promise<Notification[]> {
  const params = new URLSearchParams()
  if (bookingId) params.append('bookingId', bookingId.toString())
  if (jobId) params.append('jobId', jobId.toString())
  return apiRequest(`/notifications?${params.toString()}`)
}
