import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAvailabilityRequests, updateAvailabilityRequest } from '../../api/availabilityApi'
import { formatDateTime } from '../../lib/format'

export default function AvailabilityAdminPage() {
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [capacity, setCapacity] = useState<number | undefined>(undefined)

  const queryClient = useQueryClient()

  const cancelSelection = () => {
    setSelectedRequest(null)
    setSelectedAction(null)
    setAdminNotes('')
    setCapacity(undefined)
  }

  const { data: requests, isLoading } = useQuery({
    queryKey: ['availabilityRequests', filterStatus],
    queryFn: () => getAvailabilityRequests(filterStatus || undefined),
  })

  const updateMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: number; status: string }) =>
      updateAvailabilityRequest(requestId, {
        status,
        adminNotes: adminNotes || undefined,
        capacity: capacity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availabilityRequests'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      cancelSelection()
      alert('Request updated successfully')
    },
  })

  const handleApprove = (requestId: number, defaultCapacity: number) => {
    setSelectedRequest(requestId)
    setSelectedAction('approve')
    setCapacity(defaultCapacity)
  }

  const handleReject = (requestId: number) => {
    setSelectedRequest(requestId)
    setSelectedAction('reject')
  }

  const confirmAction = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return
    updateMutation.mutate({ requestId: selectedRequest, status })
  }

  if (isLoading) return <div>Loading requests...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Availability Requests</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-4 py-2 rounded ${filterStatus === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-4 py-2 rounded ${filterStatus === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded ${filterStatus === '' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
      </div>

      <div className="grid gap-4">
        {requests?.map((request) => (
          <div key={request.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Request #{request.id}
                  </span>
                </div>
                <p className="font-medium mb-1">
                  {formatDateTime(request.requestedStartUtc)} - {formatDateTime(request.requestedEndUtc)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Capacity: {request.requestedCapacity} spot{request.requestedCapacity !== 1 ? 's' : ''}
                </p>
                {request.notes && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Customer Notes:</strong> {request.notes}
                  </p>
                )}
                {request.adminNotes && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Admin Notes:</strong> {request.adminNotes}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Requested: {formatDateTime(request.createdAtUtc)}
                </p>
              </div>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id, request.requestedCapacity)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

            {selectedRequest === request.id && request.status === 'pending' && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={2}
                    placeholder="Add notes about this decision..."
                  />
                </div>
                {selectedAction === 'approve' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      Capacity (default: {request.requestedCapacity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={capacity || request.requestedCapacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  {selectedAction === 'approve' && (
                    <button
                      onClick={() => confirmAction('approved')}
                      disabled={updateMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Processing...' : 'Confirm Approve'}
                    </button>
                  )}
                  {selectedAction === 'reject' && (
                    <button
                      onClick={() => confirmAction('rejected')}
                      disabled={updateMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Processing...' : 'Confirm Reject'}
                    </button>
                  )}
                  <button
                    onClick={cancelSelection}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {requests?.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No {filterStatus ? filterStatus : ''} requests found.
          </div>
        )}
      </div>
    </div>
  )
}
