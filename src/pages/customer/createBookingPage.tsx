import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { estimateMoveQuote, QuoteInput, QuoteResponse, StopInput } from '../../api/bookingsApi'
import { formatDateTime, formatCurrency } from '../../lib/format'
import { getCurrentUser } from '../../api/authApi'

export default function CreateBookingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const startUtc = searchParams.get('startUtc') || ''
  const requestedTrucks = parseInt(searchParams.get('requestedTrucks') || '1')

  // Get current user to check role (optional - may not be authenticated)
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken')
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    enabled: !!hasToken,
  })

  const [formData, setFormData] = useState<QuoteInput & { customerName: string; customerEmail: string; customerPhone: string; notes: string }>(() => {
    const stored = sessionStorage.getItem('estimateData')
    const estimate = stored ? JSON.parse(stored) : null
    
    return {
      customerName: estimate?.customerName || '',
      customerEmail: estimate?.customerEmail || '',
      customerPhone: estimate?.customerPhone || '',
      notes: estimate?.notes || '',
      
      originAddress: estimate?.originAddress || '',
      originLongCarry: estimate?.originLongCarry || 'normal',
      destinationAddress: estimate?.destinationAddress || '',
      destinationLongCarry: estimate?.destinationLongCarry || 'normal',
      moveDateIso: startUtc ? new Date(startUtc).toISOString().split('T')[0] : (estimate?.moveDateIso || new Date().toISOString().split('T')[0]),
      moveType: estimate?.moveType || 'apartment',
      stopCount: estimate?.stopCount || 1,
      additionalStops: estimate?.additionalStops || [],
      roomsMoving: estimate?.roomsMoving || 1,
      bedroomsWithMattresses: estimate?.bedroomsWithMattresses || 0,
      boxCount: estimate?.boxCount || 0,
      fromStairsFlights: estimate?.fromStairsFlights || 0,
      toStairsFlights: estimate?.toStairsFlights || 0,
      fromHasElevator: estimate?.fromHasElevator || false,
      toHasElevator: estimate?.toHasElevator || false,
      specialItems: estimate?.specialItems || [],
      disassemblyNeeds: estimate?.disassemblyNeeds || 'none',
      packingService: estimate?.packingService || 'none',
    }
  })
  
  const [quote, setQuote] = useState<QuoteResponse | null>(() => {
    const stored = sessionStorage.getItem('estimateData')
    const estimate = stored ? JSON.parse(stored) : null
    return estimate?.quote || null
  })
  const selectedMoverCount = useMemo(() => {
    const stored = sessionStorage.getItem('estimateData')
    const estimate = stored ? JSON.parse(stored) : null
    return estimate?.selectedMoverCount || 2
  }, [])
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateQuote = async () => {
    if (!formData.originAddress || !formData.destinationAddress) {
      alert('Please enter both origin and destination addresses.')
      return
    }
    
    setIsCalculating(true)
    try {
      const result = await estimateMoveQuote(formData)
      setQuote(result)
    } catch (error) {
      console.error('Estimation error:', error)
      alert('Error calculating quote. Please check your addresses and try again.')
    } finally {
      setIsCalculating(false)
    }
  }

  // Redirect sales/admin users to their appropriate booking page
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'sales') {
        navigate('/sales/create-booking?' + searchParams.toString())
      } else if (currentUser.role === 'admin') {
        navigate('/admin/create-booking?' + searchParams.toString())
      }
    }
  }, [currentUser, navigate, searchParams])

  const handleAddStop = () => {
    setFormData(prev => ({
      ...prev,
      stopCount: prev.stopCount + 1,
      additionalStops: [...prev.additionalStops, { address: '', longCarry: 'normal' }]
    }))
  }

  const handleRemoveStop = (index: number) => {
    setFormData(prev => {
      const newStops = [...prev.additionalStops]
      newStops.splice(index, 1)
      return {
        ...prev,
        stopCount: prev.stopCount - 1,
        additionalStops: newStops
      }
    })
  }

  const handleStopChange = (index: number, field: keyof StopInput, value: string) => {
    setFormData(prev => {
      const newStops = [...prev.additionalStops]
      newStops[index] = { ...newStops[index], [field]: value }
      return { ...prev, additionalStops: newStops }
    })
  }

  const specialItemsList = [
    { id: 'piano', label: 'Piano' },
    { id: 'poolTable', label: 'Pool Table' },
    { id: 'safe', label: 'Safe (over 600 lbs)' },
    { id: 'heavyFurniture', label: 'Heavy Furniture (over 600 lbs)' },
    { id: 'artwork', label: 'Artwork (over $2000)' },
  ]

  const handleSpecialItemToggle = (itemId: string) => {
    setFormData(prev => {
      if (itemId === 'none') {
        return { ...prev, specialItems: [] }
      }
      const newItems = prev.specialItems.includes(itemId)
        ? prev.specialItems.filter(id => id !== itemId)
        : [...prev.specialItems, itemId]
      return { ...prev, specialItems: newItems }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!startUtc) {
      setError('Please select a time slot from the availability page')
      return
    }
    if (!quote || quote.kind === 'manual') {
      alert('Please contact us for a manual quote for this move.')
      return
    }
    
    sessionStorage.setItem('estimateData', JSON.stringify({
      ...formData,
      quote: quote,
      startUtc
    }))
    
    navigate('/checkout')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>
      
      {startUtc && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            Selected Arrival Window: {formatDateTime(startUtc)}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Information */}
        <section className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 text-blue-600">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>
        </section>

        {/* Address Information */}
        <section className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 text-blue-600">Address Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Origin Address</label>
              <input
                type="text"
                value={formData.originAddress}
                onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Street address, City, State, ZIP"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-600 mb-1">Walking Distance (Origin)</label>
              <select
                value={formData.originLongCarry}
                onChange={(e) => setFormData({ ...formData, originLongCarry: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="normal">Normal (under 75ft)</option>
                <option value="long">Long (75-150ft)</option>
                <option value="veryLong">Very Long (150ft+)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Destination Address</label>
              <input
                type="text"
                value={formData.destinationAddress}
                onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Street address, City, State, ZIP"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-600 mb-1">Walking Distance (Destination)</label>
              <select
                value={formData.destinationLongCarry}
                onChange={(e) => setFormData({ ...formData, destinationLongCarry: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="normal">Normal (under 75ft)</option>
                <option value="long">Long (75-150ft)</option>
                <option value="veryLong">Very Long (150ft+)</option>
              </select>
            </div>
          </div>

          {/* Additional Stops */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <label className="block text-lg font-bold text-gray-800">Additional Stops</label>
              <button 
                type="button" 
                onClick={handleAddStop}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold hover:bg-blue-200"
              >
                + Add Stop
              </button>
            </div>
            
            {formData.additionalStops.map((stop, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4 relative">
                <button 
                  type="button" 
                  onClick={() => handleRemoveStop(index)}
                  className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
                >
                  ✕
                </button>
                <div>
                  <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Stop {index + 1} Address</label>
                  <input
                    type="text"
                    value={stop.address}
                    onChange={(e) => handleStopChange(index, 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Street, City, State, ZIP"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Walking Distance (Stop {index + 1})</label>
                  <select
                    value={stop.longCarry}
                    onChange={(e) => handleStopChange(index, 'longCarry', e.target.value as any)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="normal">Normal (under 75ft)</option>
                    <option value="long">Long (75-150ft)</option>
                    <option value="veryLong">Very Long (150ft+)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inventory & Logistics */}
        <section className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 text-blue-600">Inventory & Logistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type</label>
              <select
                value={formData.moveType}
                onChange={(e) => setFormData({ ...formData, moveType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedroomsWithMattresses}
                  onChange={(e) => setFormData({ ...formData, bedroomsWithMattresses: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Boxes</label>
                <input
                  type="number"
                  min="0"
                  value={formData.boxCount}
                  onChange={(e) => setFormData({ ...formData, boxCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase">Origin Access</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs mb-1">Stairs (Flights)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.fromStairsFlights}
                    onChange={(e) => setFormData({ ...formData, fromStairsFlights: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <input
                    type="checkbox"
                    id="fromElevator"
                    checked={formData.fromHasElevator}
                    onChange={(e) => setFormData({ ...formData, fromHasElevator: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="fromElevator" className="text-sm">Elevator?</label>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase">Destination Access</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs mb-1">Stairs (Flights)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.toStairsFlights}
                    onChange={(e) => setFormData({ ...formData, toStairsFlights: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <input
                    type="checkbox"
                    id="toElevator"
                    checked={formData.toHasElevator}
                    onChange={(e) => setFormData({ ...formData, toHasElevator: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="toElevator" className="text-sm">Elevator?</label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Special Items */}
        <section className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 text-blue-600">Special Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialItemsList.map(item => (
              <label key={item.id} className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.specialItems.includes(item.id)}
                  onChange={() => handleSpecialItemToggle(item.id)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700 font-medium">{item.label}</span>
              </label>
            ))}
            <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.specialItems.length === 0}
                onChange={() => handleSpecialItemToggle('none')}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700 font-medium">None of the above</span>
            </label>
          </div>
        </section>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={calculateQuote}
            disabled={isCalculating}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
          >
            {isCalculating ? 'Calculating...' : 'Get Instant Quote'}
          </button>
        </div>

        {/* Pricing Summary */}
        <div className="bg-blue-600 p-6 rounded-lg shadow-lg text-white">
          <h2 className="text-xl font-bold mb-4">Estimated Quote</h2>
          {isCalculating ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Recalculating your dynamic estimate...</span>
            </div>
          ) : quote?.kind === 'instant' ? (
            <div className="space-y-4">
              <p className="text-sm opacity-90">Based on your details, here is the estimated range for {selectedMoverCount} movers:</p>
              <div className="text-3xl font-black">
                {formatCurrency((quote.options?.find(o => o.moverCount === selectedMoverCount)?.priceRange.low || quote.options![0].priceRange.low) * 100)} - {formatCurrency((quote.options?.find(o => o.moverCount === selectedMoverCount)?.priceRange.high || quote.options![0].priceRange.high) * 100)}
              </div>
              <p className="text-xs opacity-75">* Final price depends on actual time worked. Includes transport fees.</p>
            </div>
          ) : quote?.kind === 'manual' ? (
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="font-bold">Manual Quote Required</p>
              <p className="text-sm opacity-90">Your move requires manual review ({quote.reason === 'officeMove' ? 'office move' : quote.reason}).</p>
            </div>
          ) : (
            <p className="text-sm">Click "Get Instant Quote" above to see your estimate.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!quote || (quote.kind === 'manual' && !formData.customerName) || isCalculating}
          className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700 shadow-xl disabled:opacity-50 transition-all"
        >
          {quote?.kind === 'manual' ? 'Request Manual Review' : 'Proceed to Checkout'}
        </button>
      </form>
    </div>
  )
}
