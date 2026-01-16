import { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJob, updateJobStatus, assignCrew, Job, updateJob } from '../../api/jobsApi'
import { updateBooking } from '../../api/bookingsApi'
import { getEmployees, Employee } from '../../api/employeesApi'
import { getCurrentUser } from '../../api/authApi'
import { formatDateTime, formatCurrency } from '../../lib/format'

// Helper to get the portal base path from current URL
const getPortalBasePath = (pathname: string): string => {
  if (pathname.startsWith('/admin')) return '/admin'
  if (pathname.startsWith('/sales')) return '/sales'
  return '/mover'
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = getPortalBasePath(location.pathname)
  const jobId = parseInt(id || '0')
  const [showAddCrew, setShowAddCrew] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])
  
  const [isEditingTimes, setIsEditingTimes] = useState(false)
  const [editTimes, setEditTimes] = useState<{ actualStartUtc: string; actualEndUtc: string }>({
    actualStartUtc: '',
    actualEndUtc: ''
  })

  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editDetails, setEditDetails] = useState<any>(null)
  
  const [isEditingMaterials, setIsEditingMaterials] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])

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

  const saveTimesMutation = useMutation({
    mutationFn: (times: { actualStartUtc?: string | null; actualEndUtc?: string | null }) => 
      updateJob(jobId, times),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      setIsEditingTimes(false)
      alert('Times updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error updating times: ${error.message}`)
    },
  })

  const saveDetailsMutation = useMutation({
    mutationFn: async (data: any) => {
      // Split into job updates and booking updates
      const jobUpdates: any = {}
      const bookingUpdates: any = {}
      
      if ('jobNotes' in data) jobUpdates.notes = data.jobNotes
      if ('issueDescription' in data) jobUpdates.issueDescription = data.issueDescription
      
      const bookingFields = [
        'customerName', 'customerEmail', 'customerPhone', 
        'moveFromAddress', 'moveToAddress', 'moveType', 
        'requestedTrucks', 'bedroomsWithMattresses', 'boxCount', 
        'packingService', 'disassemblyNeeds', 'notes',
        'fromStories', 'fromElevator', 'toStories', 'toElevator'
      ]
      
      bookingFields.forEach(f => {
        if (f in data) bookingUpdates[f] = data[f]
      })
      
      const promises = []
      if (Object.keys(jobUpdates).length > 0) promises.push(updateJob(jobId, jobUpdates))
      if (job?.bookingId && Object.keys(bookingUpdates).length > 0) {
        promises.push(updateBooking(job.bookingId, bookingUpdates))
      }
      
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      setIsEditingDetails(false)
      alert('Details updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error updating details: ${error.message}`)
    },
  })

  const saveMaterialsMutation = useMutation({
    mutationFn: (newMaterials: any[]) => updateJob(jobId, { materialsUsed: newMaterials }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      setIsEditingMaterials(false)
      alert('Materials updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error updating materials: ${error.message}`)
    },
  })

  if (!job) return <div>Loading...</div>

  const handleStartEditTimes = () => {
    setEditTimes({
      actualStartUtc: job.actualStartUtc ? new Date(job.actualStartUtc).toISOString().slice(0, 16) : '',
      actualEndUtc: job.actualEndUtc ? new Date(job.actualEndUtc).toISOString().slice(0, 16) : ''
    })
    setIsEditingTimes(true)
  }

  const handleSaveTimes = () => {
    saveTimesMutation.mutate({
      actualStartUtc: editTimes.actualStartUtc ? new Date(editTimes.actualStartUtc).toISOString() : null,
      actualEndUtc: editTimes.actualEndUtc ? new Date(editTimes.actualEndUtc).toISOString() : null
    })
  }

  const handleStartEditDetails = () => {
    setEditDetails({
      jobNotes: job.notes || '',
      issueDescription: job.issueDescription || '',
      customerName: job.booking?.customerName || '',
      customerEmail: job.booking?.customerEmail || '',
      customerPhone: job.booking?.customerPhone || '',
      moveFromAddress: job.booking?.moveFromAddress || '',
      moveToAddress: job.booking?.moveToAddress || '',
      moveType: job.booking?.moveType || '',
      requestedTrucks: job.booking?.requestedTrucks || 1,
      bedroomsWithMattresses: job.booking?.bedroomsWithMattresses || 0,
      boxCount: job.booking?.boxCount || 0,
      packingService: job.booking?.packingService || 'none',
      disassemblyNeeds: job.booking?.disassemblyNeeds || 'none',
      notes: job.booking?.notes || '', // Booking notes
      fromStories: job.booking?.fromStories || 1,
      fromElevator: job.booking?.fromElevator || false,
      toStories: job.booking?.toStories || 1,
      toElevator: job.booking?.toElevator || false,
      additionalStopsDetailed: job.booking?.additionalStopsDetailed 
        ? JSON.parse(job.booking?.additionalStopsDetailed) 
        : [],
      specialItems: job.booking?.specialItems || [],
    })
    setIsEditingDetails(true)
  }

  const handleSaveDetails = () => {
    const dataToSave = {
      ...editDetails,
      additionalStopsDetailed: JSON.stringify(editDetails.additionalStopsDetailed)
    }
    saveDetailsMutation.mutate(dataToSave)
  }

  const handleStartEditMaterials = () => {
    setMaterials(job.materialsUsed || [])
    setIsEditingMaterials(true)
  }

  const handleSaveMaterials = () => {
    saveMaterialsMutation.mutate(materials)
  }

  const handleAddMaterial = (type: string) => {
    const existing = materials.find(m => m.type === type)
    if (existing) {
      setMaterials(materials.map(m => m.type === type ? { ...m, quantity: m.quantity + 1 } : m))
    } else {
      setMaterials([...materials, { type, quantity: 1 }])
    }
  }

  const handleUpdateMaterialQty = (type: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveMaterial(type)
    } else {
      setMaterials(materials.map(m => m.type === type ? { ...m, quantity } : m))
    }
  }

  const handleRemoveMaterial = (type: string) => {
    setMaterials(materials.filter(m => m.type !== type))
  }

  const materialTypes = [
    { id: 'smallBox', label: 'Small Box' },
    { id: 'mediumBox', label: 'Medium Box' },
    { id: 'largeBox', label: 'Large Box' },
    { id: 'tvBox', label: 'TV Box' },
    { id: 'shrinkWrap', label: 'Shrink Wrap' },
    { id: 'tape', label: 'Tape' },
  ]

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Job Details</h2>
            {isAdmin && !isEditingDetails && (
              <button
                onClick={handleStartEditDetails}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit Details
              </button>
            )}
          </div>
          
          {isEditingDetails ? (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Customer & Move Info</h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Customer Name</label>
                  <input
                    type="text"
                    value={editDetails.customerName}
                    onChange={(e) => setEditDetails({ ...editDetails, customerName: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Customer Email</label>
                  <input
                    type="email"
                    value={editDetails.customerEmail}
                    onChange={(e) => setEditDetails({ ...editDetails, customerEmail: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Customer Phone</label>
                  <input
                    type="text"
                    value={editDetails.customerPhone}
                    onChange={(e) => setEditDetails({ ...editDetails, customerPhone: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Move Type</label>
                  <select
                    value={editDetails.moveType}
                    onChange={(e) => setEditDetails({ ...editDetails, moveType: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select Property Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="storage">Storage</option>
                    <option value="house">House</option>
                    <option value="office">Office</option>
                    <option value="pod">Pod</option>
                    <option value="rentalTruck">Rental Truck</option>
                    <option value="condo">Condo</option>
                    <option value="townhome">Town-home</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">From Address</label>
                  <input
                    type="text"
                    value={editDetails.moveFromAddress}
                    onChange={(e) => setEditDetails({ ...editDetails, moveFromAddress: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold">Floor</label>
                      <input
                        type="number"
                        min="1"
                        value={editDetails.fromStories}
                        onChange={(e) => setEditDetails({ ...editDetails, fromStories: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editDetails.fromElevator}
                          onChange={(e) => setEditDetails({ ...editDetails, fromElevator: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-1 text-[10px] text-gray-700">Elevator</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">To Address</label>
                  <input
                    type="text"
                    value={editDetails.moveToAddress}
                    onChange={(e) => setEditDetails({ ...editDetails, moveToAddress: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-bold">Floor</label>
                      <input
                        type="number"
                        min="1"
                        value={editDetails.toStories}
                        onChange={(e) => setEditDetails({ ...editDetails, toStories: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editDetails.toElevator}
                          onChange={(e) => setEditDetails({ ...editDetails, toElevator: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-1 text-[10px] text-gray-700">Elevator</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 mt-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Inventory & Services</h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Trucks</label>
                  <input
                    type="number"
                    value={editDetails.requestedTrucks}
                    onChange={(e) => setEditDetails({ ...editDetails, requestedTrucks: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Bedrooms</label>
                  <input
                    type="number"
                    value={editDetails.bedroomsWithMattresses}
                    onChange={(e) => setEditDetails({ ...editDetails, bedroomsWithMattresses: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Boxes</label>
                  <input
                    type="number"
                    value={editDetails.boxCount}
                    onChange={(e) => setEditDetails({ ...editDetails, boxCount: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Packing</label>
                  <select
                    value={editDetails.packingService}
                    onChange={(e) => setEditDetails({ ...editDetails, packingService: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="none">None</option>
                    <option value="partial">Partial</option>
                    <option value="full">Full</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Disassembly</label>
                  <select
                    value={editDetails.disassemblyNeeds}
                    onChange={(e) => setEditDetails({ ...editDetails, disassemblyNeeds: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="none">None</option>
                    <option value="some">Some</option>
                    <option value="many">Many</option>
                  </select>
                </div>

                <div className="col-span-2 mt-4 border-t pt-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Special Items</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: 'piano', label: 'Piano' },
                      { id: 'poolTable', label: 'Pool Table' },
                      { id: 'safe', label: 'Safe' },
                      { id: 'heavyFurniture', label: 'Heavy Furniture' },
                      { id: 'artwork', label: 'Artwork' },
                    ].map(item => (
                      <label key={item.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editDetails.specialItems.includes(item.id)}
                          onChange={(e) => {
                            const newItems = e.target.checked
                              ? [...editDetails.specialItems, item.id]
                              : editDetails.specialItems.filter((id: string) => id !== item.id)
                            setEditDetails({ ...editDetails, specialItems: newItems })
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="col-span-2 mt-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Notes</h3>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">Booking Notes (Customer)</label>
                  <textarea
                    value={editDetails.notes}
                    onChange={(e) => setEditDetails({ ...editDetails, notes: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm h-20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">Mover/Job Notes</label>
                  <textarea
                    value={editDetails.jobNotes}
                    onChange={(e) => setEditDetails({ ...editDetails, jobNotes: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm h-20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">Issue Description</label>
                  <textarea
                    value={editDetails.issueDescription}
                    onChange={(e) => setEditDetails({ ...editDetails, issueDescription: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm h-20"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveDetails}
                  disabled={saveDetailsMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveDetailsMutation.isPending ? 'Saving...' : 'Save All Changes'}
                </button>
                <button
                  onClick={() => setIsEditingDetails(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded font-bold hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {job.booking && (
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2 text-gray-900">Customer Information</h3>
                  <p className="text-sm"><strong>Name:</strong> {job.booking.customerName}</p>
                  <p className="text-sm"><strong>Email:</strong> {job.booking.customerEmail}</p>
                  <p className="text-sm"><strong>Phone:</strong> {job.booking.customerPhone}</p>
                  <p className="text-sm"><strong>Booked By:</strong> {job.booking.salesUserName || '(self booked)'}</p>
                  <div className="mt-2">
                    <p className="text-sm"><strong>From:</strong> {job.booking.moveFromAddress}</p>
                    {(job.booking.fromStories !== undefined || job.booking.fromElevator !== undefined) && (
                      <p className="text-xs text-gray-500 ml-4">
                        Floor: {job.booking.fromStories || 1} {job.booking.fromElevator ? '(Elevator)' : '(Stairs)'}
                      </p>
                    )}
                    <p className="text-sm"><strong>To:</strong> {job.booking.moveToAddress}</p>
                    {(job.booking.toStories !== undefined || job.booking.toElevator !== undefined) && (
                      <p className="text-xs text-gray-500 ml-4">
                        Floor: {job.booking.toStories || 1} {job.booking.toElevator ? '(Elevator)' : '(Stairs)'}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <h3 className="font-medium mb-1 text-gray-900">Move Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Type:</strong> {job.booking.moveType}</p>
                      <p><strong>Trucks Requested:</strong> {job.booking.requestedTrucks}</p>
                      <p><strong>Bedrooms:</strong> {job.booking.bedroomsWithMattresses}</p>
                      <p><strong>Boxes:</strong> {job.booking.boxCount}</p>
                      <p><strong>Est. Time:</strong> {job.booking.estimatedHoursMin?.toFixed(2) || 'N/A'} - {job.booking.estimatedHoursMax?.toFixed(2) || 'N/A'} hrs</p>
                      <p><strong>Packing:</strong> {job.booking.packingService}</p>
                      <p><strong>Disassembly:</strong> {job.booking.disassemblyNeeds}</p>
                    </div>
                {job.booking.specialItems && job.booking.specialItems.length > 0 && (
                  <div className="text-sm">
                    <strong>Special Items:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {job.booking.specialItems.map((item: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                    {job.booking.additionalStopsDetailed && (
                      <div className="text-sm">
                        <strong>Additional Stops:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs text-gray-600">
                          {JSON.parse(job.booking.additionalStopsDetailed).map((stop: any, i: number) => (
                            <li key={i}>{stop.address}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {job.booking.notes && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Booking Notes:</p>
                        <p className="text-sm text-gray-600 italic whitespace-pre-wrap">"{job.booking.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned Truck Section */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-2 text-gray-900">Assigned Truck</h3>
                {job.truck ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-8 5h8m-4 5v-4m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-green-800">{job.truck.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-700">No truck assigned yet</p>
                    <p className="text-xs text-yellow-600">An admin will assign a truck to this job</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium">
                    Status: <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </p>
                  {isAdmin && job.status !== 'completed' && !isEditingTimes && (
                    <button
                      onClick={handleStartEditTimes}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit Times
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Scheduled:</strong> {formatDateTime(job.scheduledStartUtc)}
                </p>
                
                {isEditingTimes ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Edit Actual Times</h3>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Actual Start Time</label>
                      <input
                        type="datetime-local"
                        value={editTimes.actualStartUtc}
                        onChange={(e) => setEditTimes({ ...editTimes, actualStartUtc: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Actual End Time</label>
                      <input
                        type="datetime-local"
                        value={editTimes.actualEndUtc}
                        onChange={(e) => setEditTimes({ ...editTimes, actualEndUtc: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveTimes}
                        disabled={saveTimesMutation.isPending}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saveTimesMutation.isPending ? 'Saving...' : 'Save Times'}
                      </button>
                      <button
                        onClick={() => setIsEditingTimes(false)}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm font-bold hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
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

              {job.notes && (
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm font-bold text-yellow-800 mb-1">Mover/Job Notes:</p>
                  <p className="text-sm text-yellow-900">{job.notes}</p>
                </div>
              )}

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
                              navigate(`${basePath}/job/${jobId}/tip`)
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

              {job.issueDescription && (
                <div>
                  <p className="text-sm font-medium mb-1 text-red-600">Issue Description:</p>
                  <p className="text-sm text-red-600">{job.issueDescription}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Materials Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Materials</h2>
            {!isEditingMaterials && job.status !== 'completed' && (
              <button
                onClick={handleStartEditMaterials}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit Materials
              </button>
            )}
          </div>

          {isEditingMaterials ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {materialTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleAddMaterial(type.id)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
                  >
                    + {type.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t pt-4">
                {materials.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No materials added yet.</p>
                ) : (
                  materials.map(m => (
                    <div key={m.type} className="flex justify-between items-center p-2 bg-gray-50 rounded group">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRemoveMaterial(m.type)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          Remove
                        </button>
                        <span className="text-sm font-medium capitalize">
                          {materialTypes.find(t => t.id === m.type)?.label || m.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateMaterialQty(m.type, m.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold">{m.quantity}</span>
                        <button
                          onClick={() => handleUpdateMaterialQty(m.type, m.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveMaterials}
                  disabled={saveMaterialsMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMaterialsMutation.isPending ? 'Saving...' : 'Save Materials'}
                </button>
                <button
                  onClick={() => setIsEditingMaterials(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded font-bold hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {job.materialsUsed && job.materialsUsed.length > 0 ? (
                job.materialsUsed.map((m, i) => (
                  <div key={i} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="capitalize">
                      {materialTypes.find(t => t.id === m.type)?.label || m.type}
                    </span>
                    <span className="font-bold">x{m.quantity}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No materials recorded.</p>
              )}
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
