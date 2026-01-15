import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAvailabilityByDay } from '../../api/availabilityApi'
import { createBooking } from '../../api/bookingsApi'
import { formatDateTime, dollarsToCents } from '../../lib/format'
import { addMonths, endOfMonth, format as formatDate } from 'date-fns'
import AvailabilityCalendar from '../../components/AvailabilityCalendar'

export default function SalesCreateBookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ startUtc: string; endUtc: string } | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    moveFromAddress: '',
    moveToAddress: '',
    depositAmount: '100.00',
    requestedTrucks: '1',
    estimatedHours: '4',
    notes: '',
  })

  // Get date range for calendar - start from today, limit to 2 months to avoid timeout
  const { fromUtc, toUtc } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const twoMonthsFromNow = endOfMonth(addMonths(now, 2))
    return {
      fromUtc: today.toISOString(),
      toUtc: twoMonthsFromNow.toISOString(),
    }
  }, [])

  const { data: availabilityByDay, isLoading } = useQuery({
    queryKey: ['availability-by-day', fromUtc, toUtc],
    queryFn: () => getAvailabilityByDay(fromUtc, toUtc),
  })

  // Extract available dates for calendar
  const availableDates = useMemo(() => {
    return availabilityByDay?.map(day => day.date) || []
  }, [availabilityByDay])

  // Get slots for selected day, filtered to business hours (8am - 6pm local time)
  const selectedDaySlots = useMemo(() => {
    if (!selectedDate || !availabilityByDay) return []
    const dateStr = formatDate(selectedDate, 'yyyy-MM-dd')
    const dayData = availabilityByDay.find(d => d.date === dateStr)
    if (!dayData) return []
    
    // Filter slots to only show 8am - 6pm Central Time (matching backend validation)
    // Backend filters at source, but double-check here for safety
    return dayData.slots.filter((slot) => {
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
  }, [selectedDate, availabilityByDay])

  // Calculate endUtc based on startUtc + estimated hours
  const calculatedEndUtc = useMemo(() => {
    if (!selectedSlot || !formData.estimatedHours) return selectedSlot?.endUtc || null
    const start = new Date(selectedSlot.startUtc)
    const hours = parseFloat(formData.estimatedHours) || 0
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
    return end.toISOString()
  }, [selectedSlot, formData.estimatedHours])

  const [error, setError] = useState<string | null>(null)

  const bookingMutation = useMutation({
    mutationFn: () => {
      if (!selectedSlot) throw new Error('No slot selected')
      if (!calculatedEndUtc) throw new Error('Invalid estimated hours')
      const { requestedTrucks: _req, estimatedHours: _hours, ...restFormData } = formData
      return createBooking({ 
        startUtc: selectedSlot.startUtc,
        endUtc: calculatedEndUtc,
        requestedTrucks: parseInt(formData.requestedTrucks) || 1,
        ...restFormData, 
        depositAmountCents: dollarsToCents(parseFloat(formData.depositAmount))
      })
    },
    onSuccess: (data) => {
      setError(null)
      window.location.href = data.checkoutUrl
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to create booking. Please try again.'
      setError(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // Clear previous errors
    if (selectedSlot) {
      bookingMutation.mutate()
    } else {
      setError('Please select a time slot')
    }
  }

  if (isLoading) {
    return <div>Loading availability...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Booking (Sales)</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Booking Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Select Time Slot</h2>
          
          {/* Calendar */}
          <div className="mb-6">
            <AvailabilityCalendar
              onDaySelect={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null) // Reset selected slot when date changes
              }}
              availableDates={availableDates}
              selectedDate={selectedDate}
            />
          </div>

          {/* Selected day slots */}
          {selectedDate && selectedDaySlots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-4">
                Available Slots for {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="grid gap-2">
                {selectedDaySlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot({ startUtc: slot.startUtc, endUtc: slot.endUtc })}
                    className={`p-3 text-left border rounded ${
                      selectedSlot?.startUtc === slot.startUtc ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    } ${slot.remainingCapacity > 0 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                    disabled={slot.remainingCapacity === 0}
                  >
                    <p className="font-medium">{formatDateTime(slot.startUtc)}</p>
                    <p className="text-sm text-gray-600">
                      {slot.remainingCapacity} of {slot.capacity} trucks available
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && selectedDaySlots.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                No available slots for {formatDate(selectedDate, 'MMMM d, yyyy')}. Please select another date.
              </p>
            </div>
          )}

          {!selectedDate && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                Select a date on the calendar above to see available time slots.
              </p>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Move From</label>
              <input
                type="text"
                value={formData.moveFromAddress}
                onChange={(e) => setFormData({ ...formData, moveFromAddress: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Move To</label>
              <input
                type="text"
                value={formData.moveToAddress}
                onChange={(e) => setFormData({ ...formData, moveToAddress: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Requested Trucks <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                value={formData.requestedTrucks}
                onChange={(e) => setFormData({ ...formData, requestedTrucks: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Number of trucks needed for this booking</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Estimated Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Expected duration of the move. Booking will end at: {selectedSlot && formData.estimatedHours && calculatedEndUtc ? formatDateTime(calculatedEndUtc as string) : 'Select a time slot first'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deposit <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={!selectedSlot || bookingMutation.isPending}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {bookingMutation.isPending ? 'Creating...' : 'Create Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
