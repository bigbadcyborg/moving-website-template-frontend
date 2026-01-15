import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSalesBookings } from '../../api/bookingsApi'
import { getJobs, createJob, JobCreate } from '../../api/jobsApi'
import { getEmployees } from '../../api/employeesApi'
import { formatDateTime, formatCurrency } from '../../lib/format'

export default function SalesBookingsPage() {
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [createJobData, setCreateJobData] = useState<JobCreate>({
    bookingId: 0,
    notes: '',
    employeeIds: [],
  })

  const queryClient = useQueryClient()

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['salesBookings'],
    queryFn: getSalesBookings,
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['salesBookings'] })
      setShowCreateJobModal(false)
      setSelectedBookingId(null)
      setCreateJobData({ bookingId: 0, notes: '', employeeIds: [] })
      alert('Job created successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleCreateJobClick = (bookingId: number) => {
    setSelectedBookingId(bookingId)
    setCreateJobData({ bookingId, notes: '', employeeIds: [] })
    setShowCreateJobModal(true)
  }

  const handleCreateJob = () => {
    if (!createJobData.bookingId) {
      alert('Please select a booking')
      return
    }
    createJobMutation.mutate(createJobData)
  }

  if (isLoading) return <div>Loading bookings...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Sales Bookings</h1>
      <div className="grid gap-4">
        {bookings?.map((booking) => {
          const hasJob = jobs?.some((job) => job.bookingId === booking.id)
          return (
            <div key={booking.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{booking.customerName}</p>
                  <p className="text-sm text-gray-600">{formatDateTime(booking.createdAtUtc)}</p>
                  <p className="text-sm">
                    Status: <span className="capitalize">{booking.status}</span>
                  </p>
                  <p className="text-sm">Deposit: {formatCurrency(booking.depositAmountCents)}</p>
                  {booking.notes && (
                    <p className="text-sm text-gray-500 mt-1">Notes: {booking.notes}</p>
                  )}
                </div>
                {booking.status === 'confirmed' && !hasJob && (
                  <button
                    onClick={() => handleCreateJobClick(booking.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Create Job
                  </button>
                )}
                {hasJob && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Job Created
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Job Modal */}
      {showCreateJobModal && selectedBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Create Job for Booking #{selectedBookingId}</h2>
            
            {(() => {
              const booking = bookings?.find(b => b.id === selectedBookingId)
              if (!booking) return null
              return (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                    <p><strong>Customer:</strong> {booking.customerName}</p>
                    <p><strong>Email:</strong> {booking.customerEmail}</p>
                    <p><strong>From:</strong> {booking.moveFromAddress}</p>
                    <p><strong>To:</strong> {booking.moveToAddress}</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Assign Employees (optional)</label>
                    <div className="border rounded max-h-48 overflow-y-auto">
                      {employees?.map((employee) => (
                        <label
                          key={employee.id}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={createJobData.employeeIds?.includes(employee.id) || false}
                            onChange={(e) => {
                              const currentIds = createJobData.employeeIds || []
                              if (e.target.checked) {
                                setCreateJobData({ ...createJobData, employeeIds: [...currentIds, employee.id] })
                              } else {
                                setCreateJobData({ ...createJobData, employeeIds: currentIds.filter((id) => id !== employee.id) })
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {employee.userFullName || `Employee #${employee.id}`}
                            {employee.employeeNumber && ` (${employee.employeeNumber})`}
                            {employee.isManager && <span className="text-xs text-gray-500"> - Manager</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                    <textarea
                      value={createJobData.notes || ''}
                      onChange={(e) => setCreateJobData({ ...createJobData, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                      placeholder="Add any notes for this job..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateJob}
                      disabled={createJobMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateJobModal(false)
                        setSelectedBookingId(null)
                        setCreateJobData({ bookingId: 0, notes: '', employeeIds: [] })
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
