import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { estimateMoveQuote, QuoteInput, QuoteResponse, StopInput } from '../../api/bookingsApi'
import { formatCurrency } from '../../lib/format'

export default function EstimatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [formData, setFormData] = useState<QuoteInput>({
    originAddress: '',
    originLongCarry: 'normal',
    destinationAddress: '',
    destinationLongCarry: 'normal',
    moveDateIso: new Date().toISOString().split('T')[0],
    moveType: 'apartment',
    stopCount: 1,
    additionalStops: [],
    bedroomsWithMattresses: 0,
    boxCount: 0,
    fromStairsFlights: 0,
    toStairsFlights: 0,
    fromHasElevator: false,
    toHasElevator: false,
    fromStories: 1,
    fromElevator: false,
    toStories: 1,
    toElevator: false,
    specialItems: [],
    disassemblyNeeds: 'none',
    packingService: 'none',
    requestedTrucks: 1,
    roomsMoving: 1, // Keep for schema but not used in UI
  })
  
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [selectedMoverCount, setSelectedMoverCount] = useState<number>(2)
  
  const calculateQuote = async () => {
    if (!formData.originAddress || !formData.destinationAddress) {
      alert('Please enter both origin and destination addresses.')
      return
    }
    
    setIsCalculating(true)
    try {
      const result = await estimateMoveQuote(formData)
      setQuote(result)
      // Default to 2 movers if available
      if (result.kind === 'instant' && result.options) {
        setSelectedMoverCount(2)
      }
    } catch (error) {
      console.error('Estimation error:', error)
      alert('Error calculating quote. Please check your addresses and try again.')
    } finally {
      setIsCalculating(false)
    }
  }

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
    if (!quote || quote.kind === 'manual') {
      alert('Please contact us for a manual quote for this move.')
      return
    }
    
    sessionStorage.setItem('estimateData', JSON.stringify({
      ...formData,
      quote: quote,
      selectedMoverCount: selectedMoverCount
    }))
    
    if (returnTo === 'admin') {
      navigate('/admin/create-booking?fromEstimate=true')
    } else if (returnTo === 'sales') {
      navigate('/sales/create-booking?fromEstimate=true')
    } else {
      navigate('/customer/availability')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900">Get Your Move Estimate</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl space-y-8">
              {/* Origin & Destination */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-blue-600">Address Information</h2>
                
                {/* Origin */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Origin Address</label>
                    <input
                      type="text"
                      value={formData.originAddress}
                      onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Street, City, State, ZIP"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Floor Level</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.fromStories}
                        onChange={(e) => setFormData({ ...formData, fromStories: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.fromElevator}
                          onChange={(e) => setFormData({ ...formData, fromElevator: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Has Elevator</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Destination Address</label>
                    <input
                      type="text"
                      value={formData.destinationAddress}
                      onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Street, City, State, ZIP"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Floor Level</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.toStories}
                        onChange={(e) => setFormData({ ...formData, toStories: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.toElevator}
                          onChange={(e) => setFormData({ ...formData, toElevator: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Has Elevator</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Additional Stops */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <label className="block text-lg font-bold text-gray-800">Are you making any other stops?</label>
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
                    </div>
                  ))}
                </div>
              </section>

              {/* Move Type & Inventory */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-blue-600">Inventory & Logistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type</label>
                    <select
                      value={formData.moveType}
                      onChange={(e) => setFormData({ ...formData, moveType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.bedroomsWithMattresses}
                        onChange={(e) => setFormData({ ...formData, bedroomsWithMattresses: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Boxes</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.boxCount}
                        onChange={(e) => setFormData({ ...formData, boxCount: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Trucks</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.requestedTrucks}
                        onChange={(e) => setFormData({ ...formData, requestedTrucks: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Special Items */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-blue-600">Are You Planning on Moving Any of the Following Items?</h2>
                <p className="text-sm text-gray-500 -mt-4 font-bold">Check All That Apply</p>
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

              {/* More Services */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-blue-600">Special Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Disassembly & Assembly Needs</label>
                    <select
                      value={formData.disassemblyNeeds}
                      onChange={(e) => setFormData({ ...formData, disassemblyNeeds: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="none">None</option>
                      <option value="some">Some (1-3 items)</option>
                      <option value="many">Many (4+ items)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Packing Service</label>
                    <select
                      value={formData.packingService}
                      onChange={(e) => setFormData({ ...formData, packingService: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="none">No Packing</option>
                      <option value="partial">Partial Packing</option>
                      <option value="full">Full Packing</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={calculateQuote}
                  disabled={isCalculating}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                >
                  {isCalculating ? 'Calculating...' : 'Get Instant Quote'}
                </button>
              </div>
            </form>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-blue-600">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                  Your Instant Quote
                  {isCalculating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                </h2>

                {quote?.kind === 'instant' && quote.options ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Select Your Crew Size:</p>
                    {quote.options.map((opt) => (
                      <div 
                        key={opt.moverCount} 
                        onClick={() => setSelectedMoverCount(opt.moverCount)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedMoverCount === opt.moverCount 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-[1.02]' 
                          : 'bg-blue-50 border-blue-100 text-gray-900 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-bold text-lg ${selectedMoverCount === opt.moverCount ? 'text-white' : 'text-blue-700'}`}>
                            {opt.moverCount} Movers
                          </span>
                          <span className={`text-sm font-semibold ${selectedMoverCount === opt.moverCount ? 'text-blue-100' : 'text-gray-500'}`}>
                            {(() => {
                              const low = Math.round(opt.etaMinutesRange.low / 60)
                              const high = Math.round(opt.etaMinutesRange.high / 60)
                              return high <= low ? `${low}-${low + 1}` : `${low}-${high}`
                            })()} hrs
                          </span>
                        </div>
                        <div className={`text-2xl font-black ${selectedMoverCount === opt.moverCount ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(opt.priceRange.low * 100)} - {formatCurrency(opt.priceRange.high * 100)}
                        </div>
                        {opt.transportFee > 0 && (
                          <div className={`text-[10px] mt-1 ${selectedMoverCount === opt.moverCount ? 'text-blue-100' : 'text-gray-400'}`}>
                            Includes {formatCurrency(opt.transportFee * 100)} transport fee
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleSubmit}
                      className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
                    >
                      Book This Move
                    </button>
                  </div>
                ) : quote?.kind === 'manual' ? (
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-yellow-800 font-bold mb-2">Manual Quote Required</p>
                    <p className="text-sm text-yellow-700">
                      Based on your move details ({quote.reason === 'officeMove' ? 'office move' : quote.reason}), we need to review this manually to give you an accurate price.
                    </p>
                    <button className="w-full mt-4 py-2 bg-yellow-600 text-white rounded-lg font-bold">Request Review</button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <p>Fill out the form and click "Get Instant Quote" to see your pricing options.</p>
                  </div>
                )}
              </div>

              {quote?.distance && (
                <div className="bg-white p-4 rounded-xl shadow-md text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Move Distance:</span>
                    <span className="font-bold">{quote.distance.miles.toFixed(1)} miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drive Time:</span>
                    <span className="font-bold">{quote.distance.driveMinutes} mins</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
