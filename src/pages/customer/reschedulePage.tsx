import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAvailability } from '../../api/availabilityApi'
import { rescheduleBooking } from '../../api/bookingsApi'
import { formatDateTime } from '../../lib/format'
import { addMonths, startOfMonth, endOfMonth } from 'date-fns'

export default function ReschedulePage() {
  const [searchParams] = useSearchParams()
  const bookingId = parseInt(searchParams.get('bookingId') || '0')

  // Get date range - start from today, limit to 2 months to avoid timeout
  const { fromUtc, toUtc } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const twoMonthsFromNow = endOfMonth(addMonths(now, 2))
    return {
      fromUtc: today.toISOString(),
      toUtc: twoMonthsFromNow.toISOString(),
    }
  }, [])

  const { data: allSlots } = useQuery({
    queryKey: ['availability', fromUtc, toUtc],
    queryFn: () => getAvailability(fromUtc, toUtc),
  })

  // Filter slots to business hours (8am - 6pm Central Time, matching backend validation)
  // Backend filters at source, but double-check here for safety
  const slots = useMemo(() => {
    if (!allSlots) return []
    return allSlots.filter((slot) => {
      const slotTime = new Date(slot.startUtc)
      // Convert UTC to Central Time (America/Chicago) using Intl.DateTimeFormat
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        hour: '2-digit',
        hour12: false,
      })
      const parts = formatter.formatToParts(slotTime)
      const hourPart = parts.find(p => p.type === 'hour')
      const centralHour = hourPart ? parseInt(hourPart.value) : -1
      // Include slots from 8:00 AM (8) to 5:59 PM (17), but exclude 6:00 PM (18) onwards
      return centralHour >= 8 && centralHour < 18
    })
  }, [allSlots])

  const rescheduleMutation = useMutation({
    mutationFn: (data: { newStartUtc: string; newEndUtc: string; newRequestedTrucks: number }) => 
      rescheduleBooking(bookingId, data),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl
    },
  })

  const handleReschedule = (slot: { startUtc: string; endUtc: string }) => {
    rescheduleMutation.mutate({
      newStartUtc: slot.startUtc,
      newEndUtc: slot.endUtc,
      newRequestedTrucks: 1, // Default to 1 truck, could be made configurable
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reschedule Booking</h1>
      <p className="mb-4">Select a new time slot:</p>
      <div className="grid gap-4">
        {slots?.map((slot) => (
          <div key={slot.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{formatDateTime(slot.startUtc)}</p>
                <p className="text-sm text-gray-600">
                  {slot.remainingCapacity} of {slot.capacity} trucks available
                </p>
              </div>
              {slot.remainingCapacity > 0 && (
                <button
                  onClick={() => handleReschedule({ startUtc: slot.startUtc, endUtc: slot.endUtc })}
                  disabled={rescheduleMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Select
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
