import { apiRequest } from './apiClient'

export interface Employee {
  id: number
  userId: number
  employeeNumber?: string
  hourlyRateCents: number
  isManager: boolean
  userEmail?: string
  userFullName?: string
  userRole?: string
}

export interface EmployeeCreate {
  userId: number
  employeeNumber?: string
  hourlyRateCents: number
  isManager: boolean
}

export async function getEmployees(): Promise<Employee[]> {
  return apiRequest('/employees')
}

export async function createEmployee(data: EmployeeCreate): Promise<Employee> {
  return apiRequest('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
