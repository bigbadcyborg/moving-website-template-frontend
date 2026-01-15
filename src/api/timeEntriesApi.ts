import { apiRequest } from './apiClient'

export interface TimeEntry {
  id: number
  jobId: number
  employeeId: number
  checkInUtc: string
  checkOutUtc?: string
}

export async function checkIn(jobId: number): Promise<TimeEntry> {
  return apiRequest('/time-entries/check-in', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  })
}

export async function checkOut(timeEntryId: number): Promise<TimeEntry> {
  return apiRequest('/time-entries/check-out', {
    method: 'POST',
    body: JSON.stringify({ timeEntryId }),
  })
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  return apiRequest('/time-entries')
}
