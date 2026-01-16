import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmployees } from '../../api/employeesApi'
import { 
  getEmployeeSchedule, 
  updateEmployeeSchedule, 
  getAllDayOffRequests, 
  reviewDayOffRequest,
  EmployeeSchedule,
  DayOffRequest
} from '../../api/employeeAvailabilityApi'
import { formatCurrency, formatDateTime } from '../../lib/format'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function EmployeesAdminPage() {
  const queryClient = useQueryClient()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editSchedules, setEditSchedules] = useState<Partial<EmployeeSchedule>[]>([])

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const { data: dayOffRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['dayOffRequests'],
    queryFn: () => getAllDayOffRequests(),
  })

  const { data: currentSchedule, refetch: refetchSchedule } = useQuery({
    queryKey: ['employeeSchedule', selectedEmployeeId],
    queryFn: () => getEmployeeSchedule(selectedEmployeeId!),
    enabled: !!selectedEmployeeId && showScheduleModal,
  })

  const updateScheduleMutation = useMutation({
    mutationFn: (schedules: any) => updateEmployeeSchedule(selectedEmployeeId!, { schedules }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeSchedule', selectedEmployeeId] })
      setShowScheduleModal(false)
      setEditSchedules([]) // Reset edit state after save
      alert('Schedule updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error updating schedule: ${error.message}`)
    }
  })

  const reviewRequestMutation = useMutation({
    mutationFn: ({ requestId, status, reviewNotes }: { requestId: number, status: 'approved' | 'denied', reviewNotes?: string }) => 
      reviewDayOffRequest(requestId, { status, reviewNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayOffRequests'] })
      alert('Request updated')
    },
    onError: (error: Error) => {
      alert(`Error reviewing request: ${error.message}`)
    }
  })

  const handleOpenSchedule = (employeeId: number) => {
    setSelectedEmployeeId(employeeId)
    setEditSchedules([]) // Reset edit state when opening a new employee
    setShowScheduleModal(true)
  }

  const handleToggleDay = (dayIndex: number) => {
    const existing = currentSchedule?.find(s => s.dayOfWeek === dayIndex)
    const schedules = currentSchedule ? [...currentSchedule] : []
    
    // If we have a local edit state, use that
    const currentSchedules = editSchedules.length > 0 ? editSchedules : (currentSchedule || [])
    
    const updated = [...currentSchedules]
    const idx = updated.findIndex(s => s.dayOfWeek === dayIndex)
    
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], isAvailable: !updated[idx].isAvailable }
    } else {
      updated.push({ dayOfWeek: dayIndex, isAvailable: true, startTime: '08:00', endTime: '17:00' })
    }
    
    setEditSchedules(updated)
  }

  const handleSaveSchedule = () => {
    // Fill in missing days
    const finalSchedules = []
    const baseSchedules = editSchedules.length > 0 ? editSchedules : (currentSchedule || [])
    
    for (let i = 0; i < 7; i++) {
      const existing = baseSchedules.find(s => s.dayOfWeek === i)
      if (existing) {
        finalSchedules.push({
          dayOfWeek: i,
          isAvailable: existing.isAvailable,
          startTime: existing.startTime || '08:00',
          endTime: existing.endTime || '17:00'
        })
      } else {
        finalSchedules.push({
          dayOfWeek: i,
          isAvailable: false,
          startTime: '08:00',
          endTime: '17:00'
        })
      }
    }
    
    updateScheduleMutation.mutate(finalSchedules)
  }

  if (employeesLoading || (showScheduleModal && !currentSchedule)) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Existing Employees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees?.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium">
                      {employee.userFullName || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.userEmail || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.employeeNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(employee.hourlyRateCents)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.isManager ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleOpenSchedule(employee.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Manage Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees?.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No employees found. Employees are created when you add employee information to users in the Users tab.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Day Off Requests</h2>
          {requestsLoading && <div className="text-xs text-gray-500">Loading...</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dayOffRequests?.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{request.employeeName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{request.dateUtc}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 italic">"{request.reason || 'No reason provided'}"</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'denied' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => reviewRequestMutation.mutate({ requestId: request.id, status: 'approved' })}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reviewRequestMutation.mutate({ requestId: request.id, status: 'denied' })}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {dayOffRequests?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                    No day off requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Manage Recurring Schedule</h3>
                <p className="text-blue-100 text-sm">
                  {employees?.find(e => e.id === selectedEmployeeId)?.userFullName || 'Employee'}
                </p>
              </div>
              <button onClick={() => { setShowScheduleModal(false); setEditSchedules([]); }} className="text-white hover:opacity-70 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Set the days this employee is typically available to work.
              </p>
              
              <div className="space-y-2">
                {DAYS.map((day, index) => {
                  const currentSchedules = editSchedules.length > 0 ? editSchedules : (currentSchedule || [])
                  const isAvailable = currentSchedules.find(s => s.dayOfWeek === index)?.isAvailable ?? false
                  
                  return (
                    <label key={day} className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      isAvailable ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAvailable}
                          onChange={() => handleToggleDay(index)}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                        <span className={`font-bold ${isAvailable ? 'text-green-800' : 'text-gray-500'}`}>{day}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        isAvailable ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isAvailable ? 'WORKS' : 'OFF'}
                      </span>
                    </label>
                  )
                })}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSchedule}
                  disabled={updateScheduleMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateScheduleMutation.isPending ? 'Saving...' : 'Save Schedule'}
                </button>
                <button
                  onClick={() => { setShowScheduleModal(false); setEditSchedules([]); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
