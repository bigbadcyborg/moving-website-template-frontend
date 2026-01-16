import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJob, updateJobStatus, assignCrew, Job } from '../../api/jobsApi'
import { getEmployees, Employee } from '../../api/employeesApi'
import { getCurrentUser } from '../../api/authApi'
import { formatDateTime, formatCurrency } from '../../lib/format'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const jobId = parseInt(id || '0')
  const [showAddCrew, setShowAddCrew] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])

  const queryClient = useQueryClient()

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  })

  const isAdmin = currentUser?.role === 'admin'

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => updateJobStatus(jobId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  const crewMutation = useMutation({
    mutationFn: (employeeIds: number[]) => assignCrew(jobId, employeeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      setShowAddCrew(false)
      setSelectedEmployeeIds([])
      alert('Crew updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  if (!job) return <div>Loading...</div>

  const assignedCrewIds = job.assignedCrew?.map(c => c.id) || []
  const availableEmployees = employees?.filter(emp => !assignedCrewIds.includes(emp.id)) || []

  const handleAddCrew = () => {
    if (selectedEmployeeIds.length === 0) {
      alert('Please select at least one employee')
      return
    }
    const newCrew = [...assignedCrewIds, ...selectedEmployeeIds]
    crewMutation.mutate(newCrew)
  }

  const handleRemoveCrew = (employeeId: number) => {
    const newCrew = assignedCrewIds.filter(id => id !== employeeId)
    crewMutation.mutate(newCrew)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'enRoute':
        return 'bg-yellow-100 text-yellow-800'
      case 'started':
        return 'bg-green-100 text-green-800'
      case 'finishedLoading':
        return 'bg-indigo-100 text-indigo-800'
      case 'startUnloading':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'issueReported':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
 
  const getNextStatusAction = (currentStatus: string) => {
    const map: Record<string, { nextStatus: string; label: string } | null> = {
      scheduled: { nextStatus: 'enRoute', label: 'En Route' },
      enRoute: { nextStatus: 'started', label: 'Start Job' },
      started: { nextStatus: 'finishedLoading', label: 'Finished Loading' },
      finishedLoading: { nextStatus: 'startUnloading', label: 'Start Unloading' },
      startUnloading: { nextStatus: 'completed', label: 'Finish Job' },
    }
    return map[currentStatus] || null
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Job #{job.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Details */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Job Details</h2>
          
          {job.booking && (
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Customer Information</h3>
              <p className="text-sm"><strong>Name:</strong> {job.booking.customerName}</p>
              <p className="text-sm"><strong>Email:</strong> {job.booking.customerEmail}</p>
              <p className="text-sm"><strong>Phone:</strong> {job.booking.customerPhone}</p>
              <div className="mt-2">
                <p className="text-sm"><strong>From:</strong> {job.booking.moveFromAddress}</p>
                <p className="text-sm"><strong>To:</strong> {job.booking.moveToAddress}</p>
              </div>
            </div>
          )}

          <div>
            <p className="font-medium mb-1">
              Status: <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              <strong>Scheduled:</strong> {formatDateTime(job.scheduledStartUtc)}
            </p>
            {job.actualStartUtc && (
              <p className="text-sm text-gray-600">
                <strong>Actual Start:</strong> {formatDateTime(job.actualStartUtc)}
              </p>
            )}
            {job.actualEndUtc && (
              <p className="text-sm text-gray-600">
                <strong>Actual End:</strong> {formatDateTime(job.actualEndUtc)}
              </p>
            )}
            {job.baseAmountCents !== undefined && job.baseAmountCents !== null && (
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
                <p className="text-sm font-semibold text-blue-800 mb-1">Payment Details</p>
                <div className="flex justify-between text-xs text-blue-700">
                  <span>Move Total:</span>
                  <span>{formatCurrency(job.baseAmountCents)}</span>
                </div>
                {job.tipAmountCents ? (
                  <div className="flex justify-between text-xs text-blue-700">
                    <span>Tip:</span>
                    <span>{formatCurrency(job.tipAmountCents)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-bold text-blue-900 mt-1 border-t border-blue-200 pt-1">
                  <span>Total Taken:</span>
                  <span>{formatCurrency((job.baseAmountCents || 0) + (job.tipAmountCents || 0))}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Update Status</label>
            {(() => {
              const action = getNextStatusAction(job.status)
              
              return (
                <div className="space-y-4">
                  {action && (
                    <button
                      onClick={() => {
                        if (action.nextStatus === 'completed') {
                          navigate(`/mover/job/${jobId}/tip`)
                        } else {
                          statusMutation.mutate(action.nextStatus)
                        }
                      }}
                      disabled={statusMutation.isPending}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {statusMutation.isPending ? 'Updating...' : action.label}
                    </button>
                  )}
                  
                  {!action && <div className="text-sm text-gray-600 mb-2">Status: <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>{job.status}</span></div>}

                  {isAdmin && (
                    <div className="pt-4 border-t">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Admin: Reset Status</label>
                      <select
                        value={job.status}
                        onChange={(e) => statusMutation.mutate(e.target.value)}
                        disabled={statusMutation.isPending}
                        className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                      >
                        <option value="scheduled">Scheduled (Reset)</option>
                        <option value="enRoute">En Route</option>
                        <option value="started">Started</option>
                        <option value="finishedLoading">Finished Loading</option>
                        <option value="startUnloading">Start Unloading</option>
                        <option value="completed">Completed</option>
                        <option value="issueReported">Issue Reported</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1 italic">Note: Admins can bypass the normal status flow.</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {job.notes && (
            <div>
              <p className="text-sm font-medium mb-1">Notes:</p>
              <p className="text-sm text-gray-600">{job.notes}</p>
            </div>
          )}

          {job.issueDescription && (
            <div>
              <p className="text-sm font-medium mb-1 text-red-600">Issue Description:</p>
              <p className="text-sm text-red-600">{job.issueDescription}</p>
            </div>
          )}
        </div>

        {/* Crew Assignment */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Assigned Crew</h2>
            {isAdmin && !showAddCrew && (
              <button
                onClick={() => setShowAddCrew(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Crew
              </button>
            )}
          </div>

          {job.assignedCrew && job.assignedCrew.length > 0 ? (
            <div className="space-y-2">
              {job.assignedCrew.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center ${isAdmin ? 'justify-between' : 'justify-start'} p-3 bg-gray-50 rounded border`}
                >
                  <div>
                    <p className="font-medium text-sm">
                      {(() => {
                        const fullName = member.userFullName?.trim()
                        if (fullName) {
                          return fullName
                        }
                        if (member.employeeNumber?.trim()) {
                          return member.employeeNumber.trim()
                        }
                        return `Employee #${member.id}`
                      })()}
                      {member.isManager && <span className="ml-2 text-xs text-gray-500">(Manager)</span>}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveCrew(member.id)}
                      disabled={crewMutation.isPending}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No crew assigned yet.</p>
          )}

          {isAdmin && showAddCrew && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Add Crew Members</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {availableEmployees.length === 0 ? (
                  <p className="text-xs text-gray-500">All employees are already assigned</p>
                ) : (
                  availableEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployeeIds([...selectedEmployeeIds, emp.id])
                          } else {
                            setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.id))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {(() => {
                          const fullName = emp.userFullName?.trim()
                          if (fullName) {
                            return fullName
                          }
                          if (emp.employeeNumber?.trim()) {
                            return emp.employeeNumber.trim()
                          }
                          return `Employee #${emp.id}`
                        })()}
                        {emp.isManager && <span className="text-xs text-gray-500"> - Manager</span>}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddCrew}
                  disabled={crewMutation.isPending || selectedEmployeeIds.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {crewMutation.isPending ? 'Adding...' : 'Add Selected'}
                </button>
                <button
                  onClick={() => {
                    setShowAddCrew(false)
                    setSelectedEmployeeIds([])
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
