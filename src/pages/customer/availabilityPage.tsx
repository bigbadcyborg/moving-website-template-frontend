import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getAvailabilityByDay, createAvailabilityRequest } from '../../api/availabilityApi'
import { formatDateTime } from '../../lib/format'
import { Link } from 'react-router-dom'
import { addMonths, addYears, startOfMonth, endOfMonth, startOfDay, format as formatDate } from 'date-fns'
import AvailabilityCalendar from '../../components/AvailabilityCalendar'

export default function AvailabilityPage() {
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [requestData, setRequestData] = useState({
    requestedStartUtc: '',
    requestedEndUtc: '',
    requestedCapacity: 1,
    notes: '',
  })

  // Get date range for calendar - start from today, limit to 2 months to avoid timeout
  // The calendar can paginate/load more as needed
  const { fromUtc, toUtc } = useMemo(() => {
    const now = new Date()
    const today = startOfDay(now)
    const twoMonthsFromNow = endOfMonth(addMonths(now, 2))
    return {
      fromUtc: today.toISOString(),
      toUtc: twoMonthsFromNow.toISOString(),
    }
  }, [])

  const { data: availabilityByDay, isLoading, error, isError } = useQuery({
    queryKey: ['availability-by-day', fromUtc, toUtc],
    queryFn: () => getAvailabilityByDay(fromUtc, toUtc),
    retry: 1,
    staleTime: 30000,
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

  const requestMutation = useMutation({
    mutationFn: () => createAvailabilityRequest({
      requestedStartUtc: new Date(requestData.requestedStartUtc).toISOString(),
      requestedEndUtc: new Date(requestData.requestedEndUtc).toISOString(),
      requestedCapacity: requestData.requestedCapacity,
      notes: requestData.notes || undefined,
    }),
    onSuccess: () => {
      alert('Availability request submitted! An admin will review it shortly.')
      setShowRequestForm(false)
      setRequestData({
        requestedStartUtc: '',
        requestedEndUtc: '',
        requestedCapacity: 1,
        notes: '',
      })
    },
  })

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestData.requestedStartUtc || !requestData.requestedEndUtc) {
      alert('Please select both start and end times')
      return
    }
    requestMutation.mutate()
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-green-900">Need a Different Time?</h2>
              <p className="text-sm text-green-700">Request a custom availability slot</p>
            </div>
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg text-lg"
            >
              {showRequestForm ? '✕ Cancel' : '+ Request Custom Time'}
            </button>
          </div>
        </div>
        <div className="text-center py-8">
          <p>Loading availability...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-green-900">Need a Different Time?</h2>
              <p className="text-sm text-green-700">Request a custom availability slot</p>
            </div>
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg text-lg"
            >
              {showRequestForm ? '✕ Cancel' : '+ Request Custom Time'}
            </button>
          </div>
        </div>
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-bold">Error loading availability</p>
          <p className="text-red-600 text-sm mt-2">
            {error instanceof Error ? error.message : 'Failed to load availability slots'}
          </p>
          <p className="text-red-600 text-xs mt-2">
            Check that the backend is running at http://localhost:8000
          </p>
        </div>
        {showRequestForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Request Custom Availability</h2>
            <form onSubmit={handleRequestSubmit} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={requestData.requestedStartUtc}
                    onChange={(e) => setRequestData({ ...requestData, requestedStartUtc: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={requestData.requestedEndUtc}
                    onChange={(e) => setRequestData({ ...requestData, requestedEndUtc: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity (number of spots)</label>
                <input
                  type="number"
                  min="1"
                  value={requestData.requestedCapacity}
                  onChange={(e) => setRequestData({ ...requestData, requestedCapacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  value={requestData.notes}
                  onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Any special requirements or notes..."
                />
              </div>
              <button
                type="submit"
                disabled={requestMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
              {requestMutation.isError && (
                <div className="text-red-600 text-sm">
                  {requestMutation.error?.message || 'Failed to submit request'}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Always visible request button at the top */}
      <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-green-900">Need a Different Time?</h2>
            <p className="text-sm text-green-700">Request a custom availability slot</p>
          </div>
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg text-lg"
          >
            {showRequestForm ? '✕ Cancel' : '+ Request Custom Time'}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Time Slots</h1>
      </div>

      {/* Calendar */}
      <div className="mb-6">
        <AvailabilityCalendar
          onDaySelect={(date) => setSelectedDate(date)}
          availableDates={availableDates}
          selectedDate={selectedDate}
        />
      </div>

      {/* Selected day slots */}
      {selectedDate && selectedDaySlots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Available Slots for {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <div className="grid gap-4">
            {selectedDaySlots.map((slot) => (
              <div key={slot.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{formatDateTime(slot.startUtc)}</p>
                    <p className="text-sm text-gray-600">
                      {slot.remainingCapacity} of {slot.capacity} spots available
                    </p>
                  </div>
                  {slot.remainingCapacity > 0 && (
                    <Link
                      to={`/customer/create-booking?startUtc=${encodeURIComponent(slot.startUtc)}&endUtc=${encodeURIComponent(slot.endUtc)}&requestedTrucks=1`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Book Now
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedDaySlots.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            No available slots for {formatDate(selectedDate, 'MMMM d, yyyy')}. Please select another date or request a custom time slot.
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

      {showRequestForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Request Custom Availability</h2>
          <form onSubmit={handleRequestSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={requestData.requestedStartUtc}
                  onChange={(e) => setRequestData({ ...requestData, requestedStartUtc: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={requestData.requestedEndUtc}
                  onChange={(e) => setRequestData({ ...requestData, requestedEndUtc: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity (number of spots)</label>
              <input
                type="number"
                min="1"
                value={requestData.requestedCapacity}
                onChange={(e) => setRequestData({ ...requestData, requestedCapacity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={requestData.notes}
                onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder="Any special requirements or notes..."
              />
            </div>
            <button
              type="submit"
              disabled={requestMutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
            {requestMutation.isError && (
              <div className="text-red-600 text-sm">
                {requestMutation.error?.message || 'Failed to submit request'}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}
