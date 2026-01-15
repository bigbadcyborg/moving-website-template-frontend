import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createBooking } from '../../api/bookingsApi'
import { formatDateTime, dollarsToCents } from '../../lib/format'
import { getCurrentUser } from '../../api/authApi'

export default function CreateBookingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const startUtc = searchParams.get('startUtc') || ''
  const endUtc = searchParams.get('endUtc') || ''
  const initialRequestedTrucks = parseInt(searchParams.get('requestedTrucks') || '1')

  // Get current user to check role
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  })

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    moveFromAddress: '',
    moveToAddress: '',
    estimatedHours: '4',
    requestedTrucks: initialRequestedTrucks.toString(),
    depositAmount: '100.00', // Default deposit for sales users
    notes: '',
  })

  // Redirect sales/admin users to their appropriate booking page
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'sales') {
        navigate('/sales/create-booking?' + searchParams.toString())
      } else if (currentUser.role === 'admin') {
        navigate('/admin/create-booking?' + searchParams.toString())
      }
    }
  }, [currentUser, navigate, searchParams])

  // Calculate endUtc based on startUtc + estimated hours
  const calculatedEndUtc = useMemo(() => {
    if (!startUtc || !formData.estimatedHours) return endUtc
    const start = new Date(startUtc)
    const hours = parseFloat(formData.estimatedHours) || 0
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
    return end.toISOString()
  }, [startUtc, formData.estimatedHours, endUtc])

  const [error, setError] = useState<string | null>(null)

  const bookingMutation = useMutation({
    mutationFn: () => {
      if (!startUtc || !calculatedEndUtc) {
        throw new Error('Start time and end time are required. Please select a time slot from the availability page.')
      }
      
      // Validate dates are valid ISO strings
      const startDate = new Date(startUtc)
      const endDate = new Date(calculatedEndUtc)
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format. Please select a time slot from the availability page.')
      }
      
      const { estimatedHours, requestedTrucks, depositAmount, ...restFormData } = formData
      
      // Only include depositAmountCents if user is sales/admin (though they should be redirected)
      const bookingData: any = {
        startUtc,
        endUtc: calculatedEndUtc,
        requestedTrucks: parseInt(requestedTrucks) || 1,
        customerName: restFormData.customerName,
        customerEmail: restFormData.customerEmail,
        customerPhone: restFormData.customerPhone,
        moveFromAddress: restFormData.moveFromAddress,
        moveToAddress: restFormData.moveToAddress,
        notes: restFormData.notes || undefined,
      }
      
      // Customer bookings don't specify depositAmountCents - backend will use default
      // But if somehow a sales user gets here, include it
      if (currentUser && (currentUser.role === 'sales' || currentUser.role === 'admin')) {
        bookingData.depositAmountCents = dollarsToCents(parseFloat(depositAmount))
      }
      
      return createBooking(bookingData)
    },
    onSuccess: (data) => {
      setError(null)
      window.location.href = data.checkoutUrl
    },
    onError: (error: Error) => {
      // Extract error message from API error
      const errorMessage = error.message || 'Failed to create booking. Please try again.'
      setError(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // Clear previous errors
    if (!startUtc || !calculatedEndUtc) {
      setError('Please select a time slot from the availability page and enter estimated hours')
      return
    }
    bookingMutation.mutate()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Booking</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Booking Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
        <div className="grid gap-4">
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
            <label className="block text-sm font-medium mb-1">
              Number of Trucks <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.requestedTrucks}
              onChange={(e) => setFormData({ ...formData, requestedTrucks: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of trucks needed for this move
            </p>
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
              Expected duration of the move. Booking will end at: {startUtc && formData.estimatedHours ? formatDateTime(calculatedEndUtc) : 'Select a start time'}
            </p>
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
            disabled={bookingMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {bookingMutation.isPending ? 'Creating...' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    </div>
  )
}
