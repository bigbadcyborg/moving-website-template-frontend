import { apiRequest } from './apiClient'
import { z } from 'zod'

export interface Booking {
  id: number
  customerUserId: number
  salesUserId?: number
  slotId?: number  // Deprecated - kept for migration
  linkedToBookingId?: number
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  moveFromAddress: string
  moveToAddress: string
  depositAmountCents: number
  rescheduleFeeAmountCents?: number
  notes?: string
  startUtc?: string  // New bucket-based system
  endUtc?: string  // New bucket-based system
  requestedTrucks?: number  // New bucket-based system
  createdAtUtc: string
  updatedAtUtc: string
}

export interface BookingCreate {
  startUtc: string  // Start time for booking
  endUtc: string  // End time for booking (exclusive)
  requestedTrucks: number  // Number of trucks requested (default 1)
  customerName: string
  customerEmail: string
  customerPhone: string
  moveFromAddress: string
  moveToAddress: string
  notes?: string
  depositAmountCents?: number  // Sales can override
}

export async function createBooking(data: BookingCreate): Promise<{ bookingId: number; checkoutUrl: string }> {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getMyBookings(): Promise<Booking[]> {
  return apiRequest('/bookings/me')
}

export async function getSalesBookings(): Promise<Booking[]> {
  return apiRequest('/bookings/sales')
}

export async function getAllBookings(): Promise<Booking[]> {
  return apiRequest('/bookings')
}

export interface BookingRescheduleRequest {
  newStartUtc: string  // New start time for rescheduled booking
  newEndUtc: string  // New end time for rescheduled booking (exclusive)
  newRequestedTrucks: number  // Number of trucks requested (default 1)
}

export async function rescheduleBooking(bookingId: number, data: BookingRescheduleRequest): Promise<{ checkoutUrl: string; bookingId: number }> {
  return apiRequest(`/bookings/${bookingId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteBooking(bookingId: number): Promise<{ message: string }> {
  return apiRequest(`/bookings/${bookingId}`, {
    method: 'DELETE',
  })
}
