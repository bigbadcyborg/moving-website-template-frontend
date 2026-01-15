import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfig, updateConfig, getTrucks, createTruck, updateTruck, deleteTruck, Truck } from '../../api/adminApi'
import { centsToDollars, dollarsToCents } from '../../lib/format'

function TruckNamesSection() {
  const queryClient = useQueryClient()
  const { data: trucks, isLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: getTrucks,
  })

  const [editingTruck, setEditingTruck] = useState<number | null>(null)
  const [newTruckName, setNewTruckName] = useState('')
  const [editingTruckName, setEditingTruckName] = useState('')

  const createMutation = useMutation({
    mutationFn: createTruck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] })
      setNewTruckName('')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ truckId, data }: { truckId: number; data: { name?: string; isActive?: boolean } }) =>
      updateTruck(truckId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] })
      setEditingTruck(null)
      setEditingTruckName('')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTruck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] })
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleCreateTruck = () => {
    if (!newTruckName.trim()) {
      alert('Please enter a truck name')
      return
    }
    createMutation.mutate({ name: newTruckName.trim(), isActive: true })
  }

  const handleStartEdit = (truck: Truck) => {
    setEditingTruck(truck.id)
    setEditingTruckName(truck.name)
  }

  const handleSaveEdit = (truckId: number) => {
    if (!editingTruckName.trim()) {
      alert('Please enter a truck name')
      return
    }
    updateMutation.mutate({ truckId, data: { name: editingTruckName.trim() } })
  }

  const handleCancelEdit = () => {
    setEditingTruck(null)
    setEditingTruckName('')
  }

  const handleToggleActive = (truck: Truck) => {
    updateMutation.mutate({ truckId: truck.id, data: { isActive: !truck.isActive } })
  }

  const handleDeleteTruck = (truckId: number) => {
    if (confirm('Are you sure you want to delete this truck? This cannot be undone if the truck is assigned to any jobs.')) {
      deleteMutation.mutate(truckId)
    }
  }

  if (isLoading) return <div className="mt-4">Loading trucks...</div>

  return (
    <div className="mt-6 pt-6 border-t">
      <h3 className="text-lg font-semibold mb-4">Truck Names</h3>
      <div className="space-y-2">
        {trucks?.map((truck) => (
          <div key={truck.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            {editingTruck === truck.id ? (
              <>
                <input
                  type="text"
                  value={editingTruckName}
                  onChange={(e) => setEditingTruckName(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(truck.id)
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(truck.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  disabled={updateMutation.isPending}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 ${!truck.isActive ? 'text-gray-400 line-through' : ''}`}>
                  {truck.name}
                </span>
                <button
                  onClick={() => handleToggleActive(truck)}
                  className={`px-3 py-1 rounded text-sm ${
                    truck.isActive
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  disabled={updateMutation.isPending}
                >
                  {truck.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleStartEdit(truck)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTruck(truck.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 p-2">
          <input
            type="text"
            value={newTruckName}
            onChange={(e) => setNewTruckName(e.target.value)}
            placeholder="Enter truck name"
            className="flex-1 px-2 py-1 border rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTruck()
            }}
          />
          <button
            onClick={handleCreateTruck}
            className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            disabled={createMutation.isPending}
          >
            Add Truck
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const queryClient = useQueryClient()
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  const updateMutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
      alert('Configuration updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  // Local state for form values (in dollars/percentage)
  const [formData, setFormData] = useState({
    customerDeposit: '',
    customerRescheduleFee: '',
    salesDepositMin: '',
    salesDepositMax: '',
    salesRescheduleFeeMin: '',
    salesRescheduleFeeMax: '',
    salesTripFeeMin: '',
    salesTripFeeMax: '',
    salesCommissionRate: '', // percentage (e.g., 5 for 5%)
    commissionCap: '',
    holdMinutes: '',
    payPeriodDays: '',
    notificationsEnabled: false,
    totalTrucks: '',
    bucketMinutes: '',
    maxTrucksPerBooking: '',
  })

  // Initialize form when config loads
  useEffect(() => {
    if (config) {
      const toDollarsStr = (cents: number) => centsToDollars(cents).toString()
      
      setFormData({
        customerDeposit: toDollarsStr(config.customerDepositCents),
        customerRescheduleFee: toDollarsStr(config.customerRescheduleFeeCents),
        salesDepositMin: toDollarsStr(config.salesDepositMinCents),
        salesDepositMax: toDollarsStr(config.salesDepositMaxCents),
        salesRescheduleFeeMin: toDollarsStr(config.salesRescheduleFeeMinCents),
        salesRescheduleFeeMax: toDollarsStr(config.salesRescheduleFeeMaxCents),
        salesTripFeeMin: toDollarsStr(config.salesTripFeeMinCents),
        salesTripFeeMax: toDollarsStr(config.salesTripFeeMaxCents),
        salesCommissionRate: (config.salesCommissionRateBps / 100).toFixed(2), // Convert bps to percentage
        commissionCap: config.commissionCapCents ? toDollarsStr(config.commissionCapCents) : '',
        holdMinutes: config.holdMinutes.toString(),
        payPeriodDays: config.payPeriodDays.toString(),
        notificationsEnabled: config.notificationsEnabled,
        totalTrucks: config.totalTrucks.toString(),
        bucketMinutes: config.bucketMinutes.toString(),
        maxTrucksPerBooking: config.maxTrucksPerBooking ? config.maxTrucksPerBooking.toString() : '',
      })
    }
  }, [config])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert dollars to cents and percentage to basis points
    const updateData: any = {
      customerDepositCents: dollarsToCents(parseFloat(formData.customerDeposit)),
      customerRescheduleFeeCents: dollarsToCents(parseFloat(formData.customerRescheduleFee)),
      salesDepositMinCents: dollarsToCents(parseFloat(formData.salesDepositMin)),
      salesDepositMaxCents: dollarsToCents(parseFloat(formData.salesDepositMax)),
      salesRescheduleFeeMinCents: dollarsToCents(parseFloat(formData.salesRescheduleFeeMin)),
      salesRescheduleFeeMaxCents: dollarsToCents(parseFloat(formData.salesRescheduleFeeMax)),
      salesTripFeeMinCents: dollarsToCents(parseFloat(formData.salesTripFeeMin)),
      salesTripFeeMaxCents: dollarsToCents(parseFloat(formData.salesTripFeeMax)),
      salesCommissionRateBps: Math.round(parseFloat(formData.salesCommissionRate) * 100), // Convert percentage to bps
      commissionCapCents: formData.commissionCap ? dollarsToCents(parseFloat(formData.commissionCap)) : null,
      holdMinutes: parseInt(formData.holdMinutes),
      payPeriodDays: parseInt(formData.payPeriodDays),
      notificationsEnabled: formData.notificationsEnabled,
      totalTrucks: parseInt(formData.totalTrucks),
      bucketMinutes: parseInt(formData.bucketMinutes),
      maxTrucksPerBooking: formData.maxTrucksPerBooking ? parseInt(formData.maxTrucksPerBooking) : null,
    }
    
    updateMutation.mutate(updateData)
  }

  if (isLoading) return <div>Loading configuration...</div>
  if (!config) return <div>Error loading configuration</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Company Configuration</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Customer Fees */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Customer Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Deposit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.customerDeposit}
                    onChange={(e) => setFormData({ ...formData, customerDeposit: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Reschedule Fee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.customerRescheduleFee}
                    onChange={(e) => setFormData({ ...formData, customerRescheduleFee: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sales Fees */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Sales Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sales Deposit Minimum <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salesDepositMin}
                    onChange={(e) => setFormData({ ...formData, salesDepositMin: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sales Deposit Maximum <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salesDepositMax}
                    onChange={(e) => setFormData({ ...formData, salesDepositMax: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sales Reschedule Fee Minimum <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salesRescheduleFeeMin}
                    onChange={(e) => setFormData({ ...formData, salesRescheduleFeeMin: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sales Reschedule Fee Maximum <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salesRescheduleFeeMax}
                    onChange={(e) => setFormData({ ...formData, salesRescheduleFeeMax: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sales Trip Fee Minimum <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salesTripFeeMin}
                    onChange={(e) => setFormData({ ...formData, salesTripFeeMin: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sales Trip Fee Maximum <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salesTripFeeMax}
                    onChange={(e) => setFormData({ ...formData, salesTripFeeMax: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Commission Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Commission Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sales Commission Rate (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.salesCommissionRate}
                    onChange={(e) => setFormData({ ...formData, salesCommissionRate: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="5.00"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Percentage of booking value (e.g., 5.00 for 5%)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Commission Cap (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.commissionCap}
                    onChange={(e) => setFormData({ ...formData, commissionCap: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border rounded"
                    placeholder="Leave empty for no cap"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum commission per booking (optional)</p>
              </div>
            </div>
          </div>

          {/* Operational Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Operational Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hold Minutes <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.holdMinutes}
                  onChange={(e) => setFormData({ ...formData, holdMinutes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Time slot hold duration for pending payments</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pay Period Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.payPeriodDays}
                  onChange={(e) => setFormData({ ...formData, payPeriodDays: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Number of days in a pay period</p>
              </div>
            </div>
          </div>

          {/* Bucket Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bucket Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Total Trucks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalTrucks}
                  onChange={(e) => setFormData({ ...formData, totalTrucks: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Total number of trucks available for bookings</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bucket Minutes <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.bucketMinutes}
                  onChange={(e) => setFormData({ ...formData, bucketMinutes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Time bucket size in minutes (e.g., 15 for 15-minute buckets)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Trucks Per Booking (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxTrucksPerBooking}
                  onChange={(e) => setFormData({ ...formData, maxTrucksPerBooking: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Leave empty for no limit"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum number of trucks that can be requested in a single booking</p>
              </div>
            </div>
            
            {/* Truck Names Management */}
            <TruckNamesSection />
          </div>

          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Enable Notifications</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Enable email and SMS notifications</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
