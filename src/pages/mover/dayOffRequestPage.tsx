import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getMySchedule, 
  getMyDayOffRequests, 
  createDayOffRequest, 
  cancelDayOffRequest,
  EmployeeSchedule,
  DayOffRequest
} from '../../api/employeeAvailabilityApi'
import { formatDateTime } from '../../lib/format'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DayOffRequestPage() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    dateUtc: '',
    reason: ''
  })

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['mySchedule'],
    queryFn: getMySchedule,
  })

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['myDayOffRequests'],
    queryFn: getMyDayOffRequests,
  })

  const createMutation = useMutation({
    mutationFn: createDayOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDayOffRequests'] })
      setShowAddModal(false)
      setFormData({ dateUtc: '', reason: '' })
      alert('Request submitted successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    }
  })

  const cancelMutation = useMutation({
    mutationFn: cancelDayOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDayOffRequests'] })
      alert('Request cancelled')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.dateUtc) {
      alert('Please select a date')
      return
    }
    createMutation.mutate(formData)
  }

  if (scheduleLoading || requestsLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Schedule & Day Offs</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
        >
          + Request Day Off
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Weekly Schedule Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Weekly Schedule</h2>
            <div className="space-y-3">
              {DAYS.map((day, index) => {
                const daySched = schedule?.find(s => s.dayOfWeek === index)
                const isWorking = daySched?.isAvailable ?? false
                return (
                  <div key={day} className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600">{day}</span>
                    <span className={`text-xs font-black px-2 py-1 rounded-full ${
                      isWorking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isWorking ? 'WORKING' : 'OFF'}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-6 text-xs text-gray-400 italic">
              * Contact management to change your recurring schedule.
            </p>
          </div>
        </div>

        {/* Requests List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">My Day-Off Requests</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {requests?.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <p className="italic">No requests yet.</p>
                </div>
              ) : (
                requests?.map((req) => (
                  <div key={req.id} className="p-6 flex justify-between items-start hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-lg font-bold text-gray-900">{req.dateUtc}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'denied' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.reason && <p className="text-sm text-gray-500 italic">"{req.reason}"</p>}
                      {req.reviewNotes && (
                        <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                          <span className="font-bold">Manager Note:</span> {req.reviewNotes}
                        </div>
                      )}
                    </div>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => {
                          if (confirm('Cancel this request?')) {
                            cancelMutation.mutate(req.id)
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b bg-blue-600 text-white">
              <h3 className="text-2xl font-black">Request Day Off</h3>
              <p className="text-blue-100 text-sm">Select a date and provide a reason.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Requested Date</label>
                <input
                  type="date"
                  value={formData.dateUtc}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, dateUtc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why do you need this day off?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all disabled:opacity-50 shadow-xl shadow-blue-200"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Send Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
