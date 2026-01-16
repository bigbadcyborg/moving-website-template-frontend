import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getJobs, getJobsByDay, Job } from '../../api/jobsApi'
import { formatDateTime } from '../../lib/format'
import { Link } from 'react-router-dom'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'
import JobsCalendar from '../../components/JobsCalendar'

export default function SalesJobsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

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

  const { data: jobsByDay } = useQuery({
    queryKey: ['jobs-by-day', calendarFromUtc, calendarToUtc],
    queryFn: () => getJobsByDay(calendarFromUtc, calendarToUtc),
  })

  // Extract available dates for calendar
  const availableDates = useMemo(() => {
    return jobsByDay?.map(day => day.date) || []
  }, [jobsByDay])

  // Get jobs for selected day
  const selectedDayJobs = useMemo(() => {
    if (!selectedCalendarDate || !jobsByDay) return []
    const dateStr = selectedCalendarDate.toISOString().split('T')[0]
    const dayData = jobsByDay.find(d => d.date === dateStr)
    return dayData?.jobs || []
  }, [selectedCalendarDate, jobsByDay])

  const filteredJobs = jobs?.filter((job) => {
    if (statusFilter && job.status !== statusFilter) return false
    return true
  }) || []

  if (jobsLoading) return <div>Loading jobs...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Jobs</h1>

      {/* View Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Table View
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 rounded ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Calendar View
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <JobsCalendar
              onDaySelect={(date) => setSelectedCalendarDate(date)}
              availableDates={availableDates}
              selectedDate={selectedCalendarDate}
            />
          </div>
          <div>
            {selectedCalendarDate && selectedDayJobs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Jobs for {selectedCalendarDate.toLocaleDateString()}
                </h3>
                <div className="grid gap-4">
                  {selectedDayJobs.map((job) => (
                    <div key={job.id} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Job #{job.id}</p>
                          <p className="text-sm text-gray-600">
                            {formatDateTime(job.scheduledStartUtc)}
                          </p>
                          <p className="text-sm">
                            Status: <span className="capitalize">{job.status}</span>
                          </p>
                          {job.notes && (
                            <p className="text-sm text-gray-500 mt-1">Notes: {job.notes}</p>
                          )}
                        </div>
                        <Link
                          to={`/sales/job/${job.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedCalendarDate && selectedDayJobs.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">No jobs scheduled for this date</p>
              </div>
            )}
            {!selectedCalendarDate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">Select a date on the calendar to view jobs</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
          </div>

          {/* Jobs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No jobs found
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{job.id}</td>
                        <td className="px-4 py-3 text-sm">{job.bookingId}</td>
                        <td className="px-4 py-3 text-sm">
                          {job.booking?.customerName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDateTime(job.scheduledStartUtc)}
                          {job.booking?.estimatedHoursMin && (
                            <div className="text-xs text-gray-500">
                              {job.booking.estimatedHoursMin.toFixed(2)}-{job.booking.estimatedHoursMax?.toFixed(2)} hrs
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'inProgress' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            to={`/sales/job/${job.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
