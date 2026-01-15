import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJobs, getJobsByDay, assignCrew, createJob, Job, JobCreate } from '../../api/jobsApi'
import { getEmployees } from '../../api/employeesApi'
import { getAllBookings } from '../../api/bookingsApi'
import { formatDateTime } from '../../lib/format'
import { Link } from 'react-router-dom'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'
import JobsCalendar from '../../components/JobsCalendar'

export default function JobsAdminPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [createJobData, setCreateJobData] = useState<JobCreate>({
    notes: '',
    employeeIds: [],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    moveFromAddress: '',
    moveToAddress: '',
  })
  const [createJobMode, setCreateJobMode] = useState<'existing' | 'new'>('new')

  const queryClient = useQueryClient()

  // Calendar date range - current month + next month
  const { calendarFromUtc, calendarToUtc } = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const nextMonthEnd = endOfMonth(addMonths(now, 1))
    return {
      calendarFromUtc: monthStart.toISOString(),
      calendarToUtc: nextMonthEnd.toISOString(),
    }
  }, [])

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', statusFilter, dateFrom, dateTo],
    queryFn: () => {
      const params: { dateFromUtc?: string; dateToUtc?: string } = {}
      if (dateFrom) params.dateFromUtc = new Date(dateFrom).toISOString()
      if (dateTo) params.dateToUtc = new Date(dateTo + 'T23:59:59').toISOString()
      return getJobs(params.dateFromUtc, params.dateToUtc)
    },
  })

  // Fetch all jobs (without date filters) to properly check which bookings have jobs
  const { data: allJobs } = useQuery({
    queryKey: ['all-jobs'],
    queryFn: () => getJobs(),
  })

  const { data: jobsByDay } = useQuery({
    queryKey: ['jobs-by-day', calendarFromUtc, calendarToUtc],
    queryFn: () => getJobsByDay(calendarFromUtc, calendarToUtc),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const { data: bookings } = useQuery({
    queryKey: ['allBookings'],
    queryFn: getAllBookings,
  })

  // Get bookings without jobs - use allJobs instead of filtered jobs
  const bookingsWithoutJobs = bookings?.filter((booking) => {
    // Filter for confirmed bookings that don't have a job
    if (booking.status !== 'confirmed') return false
    const hasJob = allJobs?.some((job) => job.bookingId === booking.id)
    return !hasJob
  }) || []

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['allBookings'] })
      queryClient.invalidateQueries({ queryKey: ['all-jobs'] })
      setShowCreateModal(false)
      setCreateJobData({
        notes: '',
        employeeIds: [],
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        moveFromAddress: '',
        moveToAddress: '',
      })
      setCreateJobMode('new')
      alert('Job created successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ jobId, employeeIds }: { jobId: number; employeeIds: number[] }) =>
      assignCrew(jobId, employeeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      setShowAssignModal(false)
      setSelectedJob(null)
      setSelectedEmployeeIds([])
      alert('Crew assigned successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const filteredJobs = jobs?.filter((job) => {
    if (statusFilter && job.status !== statusFilter) return false
    return true
  })

  const handleAssignClick = (job: Job) => {
    setSelectedJob(job)
    setSelectedEmployeeIds(job.assignedCrew?.map((c) => c.id) || [])
    setShowAssignModal(true)
  }

  const handleAssignSubmit = () => {
    if (!selectedJob) return
    assignMutation.mutate({
      jobId: selectedJob.id,
      employeeIds: selectedEmployeeIds,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'enRoute':
        return 'bg-yellow-100 text-yellow-800'
      case 'started':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'issueReported':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (jobsLoading) {
    return <div>Loading jobs...</div>
  }

  const handleCreateJob = () => {
    if (createJobMode === 'existing') {
      if (!createJobData.bookingId) {
        alert('Please select a booking')
        return
      }
    } else {
      if (!createJobData.customerName || !createJobData.customerEmail || !createJobData.customerPhone) {
        alert('Please fill in customer name, email, and phone')
        return
      }
      if (!createJobData.scheduledStartUtc) {
        alert('Please select a scheduled start time')
        return
      }
    }
    createJobMutation.mutate(createJobData)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs Management</h1>
        <div className="flex gap-2">
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Job
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && jobsByDay && (
        <div className="mb-6">
          <JobsCalendar
            jobsByDay={jobsByDay}
            onDaySelect={(date) => setSelectedCalendarDate(date)}
            selectedDate={selectedCalendarDate}
          />
        </div>
      )}

      {/* Filters */}
      {viewMode === 'table' && (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="enRoute">En Route</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
              <option value="issueReported">Issue Reported</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('')
                setDateFrom('')
                setDateTo('')
              }}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crew
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs?.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/mover/job/${job.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      #{job.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {job.booking ? (
                      <div>
                        <div className="font-medium">{job.booking.customerName}</div>
                        <div className="text-gray-500 text-xs">{job.booking.customerEmail}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDateTime(job.scheduledStartUtc)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {job.assignedCrew && job.assignedCrew.length > 0 ? (
                      <div className="space-y-1">
                        {job.assignedCrew.map((member) => (
                          <div key={member.id} className="text-xs">
                            {member.employeeNumber || `Emp #${member.id}`}
                            {member.isManager && <span className="ml-1 text-gray-500">(Mgr)</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No crew assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleAssignClick(job)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Assign Crew
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredJobs?.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No jobs found. {jobs?.length === 0 ? 'No jobs exist yet.' : 'Try adjusting your filters.'}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Assign Crew Modal */}
      {showAssignModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              Assign Crew to Job #{selectedJob.id}
            </h2>
            {selectedJob.booking && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  <strong>Customer:</strong> {selectedJob.booking.customerName}
                </p>
                <p className="text-sm">
                  <strong>Scheduled:</strong> {formatDateTime(selectedJob.scheduledStartUtc)}
                </p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Employees</label>
              <div className="border rounded max-h-60 overflow-y-auto">
                {employees?.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployeeIds([...selectedEmployeeIds, employee.id])
                        } else {
                          setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== employee.id))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {employee.userFullName || `Employee #${employee.id}`} 
                      {employee.userEmail && ` (${employee.userEmail})`}
                      {employee.employeeNumber && ` - ${employee.employeeNumber}`}
                      {employee.userRole && ` - ${employee.userRole}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAssignSubmit}
                disabled={assignMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign Crew'}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedJob(null)
                  setSelectedEmployeeIds([])
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Job</h2>
            
            {/* Mode Toggle */}
            <div className="mb-4 flex gap-2 border-b pb-3">
              <button
                onClick={() => setCreateJobMode('new')}
                className={`px-4 py-2 text-sm rounded ${
                  createJobMode === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                New Job
              </button>
              {bookingsWithoutJobs.length > 0 && (
                <button
                  onClick={() => setCreateJobMode('existing')}
                  className={`px-4 py-2 text-sm rounded ${
                    createJobMode === 'existing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  From Existing Booking
                </button>
              )}
            </div>

            {createJobMode === 'existing' ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Select Booking <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createJobData.bookingId || 0}
                    onChange={(e) => setCreateJobData({ ...createJobData, bookingId: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value={0}>Select a booking</option>
                    {bookingsWithoutJobs.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        Booking #{booking.id} - {booking.customerName} ({booking.customerEmail})
                      </option>
                    ))}
                  </select>
                  {createJobData.bookingId && createJobData.bookingId > 0 && (
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      {(() => {
                        const booking = bookingsWithoutJobs.find(b => b.id === createJobData.bookingId)
                        if (!booking) return null
                        return (
                          <>
                            <p><strong>Customer:</strong> {booking.customerName}</p>
                            <p><strong>Email:</strong> {booking.customerEmail}</p>
                            <p><strong>From:</strong> {booking.moveFromAddress}</p>
                            <p><strong>To:</strong> {booking.moveToAddress}</p>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createJobData.customerName || ''}
                    onChange={(e) => setCreateJobData({ ...createJobData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Customer Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createJobData.customerEmail || ''}
                    onChange={(e) => setCreateJobData({ ...createJobData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Customer Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={createJobData.customerPhone || ''}
                    onChange={(e) => setCreateJobData({ ...createJobData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Scheduled Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={createJobData.scheduledStartUtc ? new Date(createJobData.scheduledStartUtc).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCreateJobData({ ...createJobData, scheduledStartUtc: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">From Address (optional)</label>
                  <input
                    type="text"
                    value={createJobData.moveFromAddress || ''}
                    onChange={(e) => setCreateJobData({ ...createJobData, moveFromAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">To Address (optional)</label>
                  <input
                    type="text"
                    value={createJobData.moveToAddress || ''}
                    onChange={(e) => setCreateJobData({ ...createJobData, moveToAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </>
            )}

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
                  setShowCreateModal(false)
                  setCreateJobData({
                    notes: '',
                    employeeIds: [],
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    moveFromAddress: '',
                    moveToAddress: '',
                  })
                  setCreateJobMode('new')
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
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
