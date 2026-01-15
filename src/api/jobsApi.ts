import { apiRequest } from './apiClient'

export interface EmployeeInfo {
  id: number
  userId: number
  employeeNumber?: string
  hourlyRateCents: number
  isManager: boolean
  userFullName?: string
}

export interface BookingInfo {
  id: number
  customerName: string
  customerEmail: string
  customerPhone: string
  moveFromAddress: string
  moveToAddress: string
  status: string
}

export interface JobCreate {
  bookingId?: number  // Optional - can create job directly
  scheduledStartUtc?: string  // Required if no bookingId
  customerName?: string  // Required if no bookingId
  customerEmail?: string  // Required if no bookingId
  customerPhone?: string  // Required if no bookingId
  moveFromAddress?: string
  moveToAddress?: string
  notes?: string
  employeeIds?: number[]
}

export interface TruckInfo {
  id: number
  name: string
  isActive: boolean
}

export interface Job {
  id: number
  bookingId: number
  truckId?: number | null
  status: string
  scheduledStartUtc: string
  actualStartUtc?: string
  actualEndUtc?: string
  notes?: string
  issueDescription?: string
  assignedCrew?: EmployeeInfo[]
  booking?: BookingInfo
  truck?: TruckInfo | null
}

export interface JobsByDay {
  date: string // YYYY-MM-DD
  jobs: Job[]
}

export async function getJobs(dateFromUtc?: string, dateToUtc?: string, employeeId?: number): Promise<Job[]> {
  const params = new URLSearchParams()
  if (dateFromUtc) params.append('dateFromUtc', dateFromUtc)
  if (dateToUtc) params.append('dateToUtc', dateToUtc)
  if (employeeId) params.append('employeeId', employeeId.toString())
  return apiRequest(`/jobs?${params.toString()}`)
}

export async function getJobsForEmployee(employeeId: number, dateFromUtc?: string, dateToUtc?: string): Promise<Job[]> {
  return getJobs(dateFromUtc, dateToUtc, employeeId)
}

export async function getJobsByDay(dateFromUtc?: string, dateToUtc?: string, employeeId?: number): Promise<JobsByDay[]> {
  const params = new URLSearchParams()
  if (dateFromUtc) params.append('dateFromUtc', dateFromUtc)
  if (dateToUtc) params.append('dateToUtc', dateToUtc)
  if (employeeId) params.append('employeeId', employeeId.toString())
  return apiRequest(`/jobs/by-day?${params.toString()}`)
}

export async function createJob(data: JobCreate): Promise<Job> {
  return apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getJob(jobId: number): Promise<Job> {
  return apiRequest(`/jobs/${jobId}`)
}

export async function updateJobStatus(jobId: number, newStatus: string): Promise<Job> {
  return apiRequest(`/jobs/${jobId}/status`, {
    method: 'POST',
    body: JSON.stringify({ newStatus }),
  })
}

export async function assignCrew(jobId: number, employeeIds: number[]): Promise<void> {
  return apiRequest(`/jobs/${jobId}/crew`, {
    method: 'POST',
    body: JSON.stringify({ employeeIds }),
  })
}

export interface JobUpdate {
  notes?: string
  issueDescription?: string
  truckId?: number | null
}

export async function updateJob(jobId: number, data: JobUpdate): Promise<Job> {
  return apiRequest(`/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
