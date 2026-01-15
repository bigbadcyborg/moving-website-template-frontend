import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllBookings, deleteBooking } from '../../api/bookingsApi'
import { formatDateTime, formatCurrency } from '../../lib/format'

export default function BookingsAdminPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null)
  
  const queryClient = useQueryClient()

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['allBookings', statusFilter],
    queryFn: getAllBookings,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] })
      setBookingToDelete(null)
      alert('Booking deleted successfully')
    },
    onError: (error: Error) => {
      alert(`Error deleting booking: ${error.message}`)
    },
  })

  const filteredBookings = bookings?.filter((booking) => {
    if (!statusFilter) return true
    return booking.status === statusFilter
  }) || []

  if (isLoading) return <div>Loading bookings...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Bookings</h1>
      
      {/* Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="pendingPayment">Pending Payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="reschedulePendingPayment">Reschedule Pending Payment</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="canceled">Canceled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            No bookings found
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <p className="text-lg font-semibold">{booking.customerName}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pendingPayment' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'canceled' ? 'bg-red-100 text-red-800' :
                      booking.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.salesUserId && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        Sales Booking
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{booking.customerEmail} | {booking.customerPhone}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                    <div>
                      <p className="text-gray-500">From:</p>
                      <p>{booking.moveFromAddress}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">To:</p>
                      <p>{booking.moveToAddress}</p>
                    </div>
                  </div>
                  {booking.startUtc && (
                    <div className="text-sm mb-2">
                      <p className="text-gray-500">Time Slot:</p>
                      <p>{formatDateTime(booking.startUtc)} - {formatDateTime(booking.endUtc || booking.startUtc)}</p>
                    </div>
                  )}
                  <div className="flex gap-4 text-sm">
                    <p><span className="text-gray-500">Deposit:</span> {formatCurrency(booking.depositAmountCents)}</p>
                    {booking.requestedTrucks && (
                      <p><span className="text-gray-500">Trucks:</span> {booking.requestedTrucks}</p>
                    )}
                    <p><span className="text-gray-500">Created:</span> {formatDateTime(booking.createdAtUtc)}</p>
                  </div>
                  {booking.notes && (
                    <p className="text-sm text-gray-600 mt-2">Notes: {booking.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setBookingToDelete(booking.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Delete Booking</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            {(() => {
              const booking = bookings?.find(b => b.id === bookingToDelete)
              if (!booking) return null
              return (
                <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                  <p><strong>Customer:</strong> {booking.customerName}</p>
                  <p><strong>Booking ID:</strong> #{booking.id}</p>
                  <p><strong>Status:</strong> {booking.status}</p>
                </div>
              )
            })()}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (bookingToDelete) {
                    deleteMutation.mutate(bookingToDelete)
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Booking'}
              </button>
              <button
                onClick={() => setBookingToDelete(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
