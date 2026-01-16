import { apiRequest } from './apiClient'

export interface EmployeeSchedule {
  id: number
  employeeId: number
  dayOfWeek: number // 0=Monday, 6=Sunday
  isAvailable: boolean
  startTime?: string | null
  endTime?: string | null
}

export interface EmployeeScheduleUpdate {
  schedules: {
    dayOfWeek: number
    isAvailable: boolean
    startTime?: string | null
    endTime?: string | null
  }[]
}

export interface DayOffRequest {
  id: number
  employeeId: number
  dateUtc: string
  reason?: string | null
  status: 'pending' | 'approved' | 'denied'
  reviewedByUserId?: number | null
  reviewedAtUtc?: string | null
  reviewNotes?: string | null
  createdAtUtc: string
  updatedAtUtc: string
  employeeName?: string | null
}

export interface DayOffRequestCreate {
  dateUtc: string
  reason?: string
}

export interface DayOffRequestReview {
  status: 'approved' | 'denied'
  reviewNotes?: string
}

// Admin Endpoints
export async function getEmployeeSchedule(employeeId: number): Promise<EmployeeSchedule[]> {
  return apiRequest(`/employee-availability/employees/${employeeId}/schedule`)
}

export async function updateEmployeeSchedule(employeeId: number, schedules: EmployeeScheduleUpdate): Promise<EmployeeSchedule[]> {
  return apiRequest(`/employee-availability/employees/${employeeId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify(schedules),
  })
}

export async function getAllDayOffRequests(status?: string): Promise<DayOffRequest[]> {
  const query = status ? `?status=${status}` : ''
  return apiRequest(`/employee-availability/day-off-requests${query}`)
}

export async function reviewDayOffRequest(requestId: number, review: DayOffRequestReview): Promise<DayOffRequest> {
  return apiRequest(`/employee-availability/day-off-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(review),
  })
}

// Employee Endpoints
export async function getMySchedule(): Promise<EmployeeSchedule[]> {
  return apiRequest('/employee-availability/my/schedule')
}

export async function getMyDayOffRequests(): Promise<DayOffRequest[]> {
  return apiRequest('/employee-availability/my/day-off-requests')
}

export async function createDayOffRequest(data: DayOffRequestCreate): Promise<DayOffRequest> {
  return apiRequest('/employee-availability/my/day-off-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function cancelDayOffRequest(requestId: number): Promise<{ message: string }> {
  return apiRequest(`/employee-availability/my/day-off-requests/${requestId}`, {
    method: 'DELETE',
  })
}
