import { useQuery } from '@tanstack/react-query'
import { getMyBookings } from '../../api/bookingsApi'
import { formatDateTime, formatCurrency } from '../../lib/format'
import { Link } from 'react-router-dom'

export default function MyBookingsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
  })

  if (isLoading) return <div>Loading bookings...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      <div className="grid gap-4">
        {bookings?.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            No bookings found
          </div>
        ) : (
          bookings?.map((booking) => (
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
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{booking.customerEmail} | {booking.customerPhone}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-2">
                    <div>
                      <p className="text-gray-500">From:</p>
                      <p className="font-medium">{booking.moveFromAddress}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">To:</p>
                      <p className="font-medium">{booking.moveToAddress}</p>
                    </div>
                  </div>
                  {booking.startUtc && (
                    <div className="text-sm mb-2">
                      <p className="text-gray-500">Scheduled Time:</p>
                      <p className="font-medium">
                        {formatDateTime(booking.startUtc)} - {formatDateTime(booking.endUtc || booking.startUtc)}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm mb-2">
                    <p>
                      <span className="text-gray-500">Deposit:</span> <span className="font-medium">{formatCurrency(booking.depositAmountCents)}</span>
                    </p>
                    {booking.requestedTrucks && (
                      <p>
                        <span className="text-gray-500">Trucks:</span> <span className="font-medium">{booking.requestedTrucks}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-gray-500">Booking ID:</span> <span className="font-medium">#{booking.id}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Created:</span> <span className="font-medium">{formatDateTime(booking.createdAtUtc)}</span>
                    </p>
                  </div>
                  {booking.notes && (
                    <div className="text-sm mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-gray-500 mb-1">Notes:</p>
                      <p className="text-gray-700">{booking.notes}</p>
                    </div>
                  )}
                  {booking.rescheduleFeeAmountCents && (
                    <p className="text-sm text-gray-600 mt-2">
                      Reschedule Fee: {formatCurrency(booking.rescheduleFeeAmountCents)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {booking.status === 'confirmed' && (
                    <Link
                      to={`/customer/reschedule?bookingId=${booking.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                    >
                      Reschedule
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
