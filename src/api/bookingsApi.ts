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
  salesUserName?: string
  createdAtUtc: string
  updatedAtUtc: string
  moveType?: string
  stopCount?: number
  additionalStopsDetailed?: string
  roomsMoving?: number
  bedroomsWithMattresses?: number
  boxCount?: number
  fromStairsFlights?: number
  toStairsFlights?: number
  fromHasElevator?: boolean
  toHasElevator?: boolean
  fromStories?: number
  fromElevator?: boolean
  toStories?: number
  toElevator?: boolean
  originLongCarry?: string
  destinationLongCarry?: string
  specialItems?: string[]
  estimatedHours?: number // Deprecated
  estimatedHoursMin?: number
  estimatedHoursMax?: number
  disassemblyNeeds?: string
  packingService?: string
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
  
  // New Estimation Logic Input Fields
  moveType?: string
  stopCount?: number
  additionalStopsDetailed?: string // JSON string of StopInput[]
  roomsMoving?: number
  bedroomsWithMattresses?: number
  boxCount?: number
  fromStairsFlights?: number
  toStairsFlights?: number
  fromHasElevator?: boolean
  toHasElevator?: boolean
  fromStories?: number
  fromElevator?: boolean
  toStories?: number
  toElevator?: boolean
  originLongCarry?: string
  destinationLongCarry?: string
  specialItems?: string[]
  disassemblyNeeds?: string
  packingService?: string

  // Move details - Starting location (Keep for compatibility)
  fromStreetAddress?: string
  fromZipCode?: string
  fromPropertyType?: string
  fromSize?: string
  fromStories?: number
  fromParkingDistance?: number
  fromElevator?: boolean
  // Move details - Final location (Keep for compatibility)
  toStreetAddress?: string
  toZipCode?: string
  toPropertyType?: string
  toSize?: string
  toStories?: number
  toParkingDistance?: number
  toElevator?: boolean
  // Other information
  urgent24Hours?: boolean
  additionalStops?: boolean
  needsPacking?: boolean
  estimatedHours?: number // Deprecated
  estimatedHoursMin?: number
  estimatedHoursMax?: number
}

export interface BookingUpdate {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  moveFromAddress?: string
  moveToAddress?: string
  notes?: string
  moveType?: string
  stopCount?: number
  additionalStopsDetailed?: string
  roomsMoving?: number
  bedroomsWithMattresses?: number
  boxCount?: number
  fromStairsFlights?: number
  toStairsFlights?: number
  fromHasElevator?: boolean
  toHasElevator?: boolean
  fromStories?: number
  fromElevator?: boolean
  toStories?: number
  toElevator?: boolean
  originLongCarry?: string
  destinationLongCarry?: string
  disassemblyNeeds?: string
  packingService?: string
  specialItems?: string[]
  requestedTrucks?: number
}

export async function updateBooking(bookingId: number, data: BookingUpdate): Promise<Booking> {
  return apiRequest(`/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function createBooking(data: BookingCreate): Promise<{ bookingId: number; checkoutUrl: string }> {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function createPublicBooking(data: BookingCreate): Promise<{ bookingId: number; checkoutUrl: string }> {
  return apiRequest('/bookings/public', {
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

export interface StopInput {
  address: string
  longCarry: 'normal' | 'long' | 'veryLong'
}

export interface QuoteInput {
  originAddress: string
  originLongCarry: 'normal' | 'long' | 'veryLong'
  destinationAddress: string
  destinationLongCarry: 'normal' | 'long' | 'veryLong'
  moveDateIso: string
  moveType: 'apartment' | 'house' | 'storage' | 'office' | 'pod' | 'rentalTruck' | 'condo' | 'townhome' | 'other'
  stopCount: number
  additionalStops: StopInput[]
  roomsMoving: number
  bedroomsWithMattresses: number
  boxCount: number
  fromStairsFlights: number
  toStairsFlights: number
  fromHasElevator: boolean
  toHasElevator: boolean
  fromStories: number
  fromElevator: boolean
  toStories: number
  toElevator: boolean
  specialItems: string[]
  disassemblyNeeds: 'none' | 'some' | 'many'
  packingService: 'none' | 'partial' | 'full'
  requestedTrucks: number
}

export interface QuoteOption {
  moverCount: number
  etaMinutesRange: { low: number; high: number }
  priceRange: { low: number; high: number }
  transportFee: number
}

export interface QuoteResponse {
  kind: 'instant' | 'manual'
  reason?: string
  options?: QuoteOption[]
  distance?: { miles: number; driveMinutes: number }
  points?: number
}

export interface MoveEstimationRequest {
  fromPropertyType: string
  fromSize: string
  fromStories: number
  fromParkingDistance: number
  fromElevator: boolean
  toPropertyType: string
  toSize: string
  toStories: number
  toParkingDistance: number
  toElevator: boolean
  urgent24Hours: boolean
  additionalStops: boolean
  needsPacking: boolean
  specialItems: string[]
  requestedTrucks: number
}

export async function estimateMoveQuote(data: QuoteInput): Promise<QuoteResponse> {
  return apiRequest('/bookings/estimate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** @deprecated Use estimateMoveQuote instead */
export async function estimateMoveTime(data: any): Promise<{ estimatedHours: number }> {
  return apiRequest('/bookings/estimate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
