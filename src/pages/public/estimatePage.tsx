import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { estimateMoveQuote, QuoteInput, QuoteResponse, StopInput } from '../../api/bookingsApi'
import { formatCurrency } from '../../lib/format'

export default function EstimatePage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<QuoteInput>({
    originAddress: '',
    originLongCarry: 'normal',
    destinationAddress: '',
    destinationLongCarry: 'normal',
    moveDateIso: new Date().toISOString().split('T')[0],
    moveType: 'apartment',
    stopCount: 1,
    additionalStops: [],
    roomsMoving: 1, // Default 1 room (living room)
    bedroomsWithMattresses: 0,
    boxCount: 0,
    fromStairsFlights: 0,
    toStairsFlights: 0,
    fromHasElevator: false,
    toHasElevator: false,
    specialItems: [],
    disassemblyNeeds: 'none',
    packingService: 'none',
  })
  
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  
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
      quote: quote
    }))
    
    navigate('/customer/availability')
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
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-orange-500">Address Information</h2>
                
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 text-blue-600">Walking Distance from Truck to Door (Origin)</label>
                    <select
                      value={formData.originLongCarry}
                      onChange={(e) => setFormData({ ...formData, originLongCarry: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="normal">Normal (under 75ft)</option>
                      <option value="long">Long (75-150ft)</option>
                      <option value="veryLong">Very Long (150ft+)</option>
                    </select>
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 text-blue-600">Walking Distance from Truck to Door (Destination)</label>
                    <select
                      value={formData.destinationLongCarry}
                      onChange={(e) => setFormData({ ...formData, destinationLongCarry: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    <label className="block text-lg font-bold text-gray-800">Are you making any other stops?</label>
                    <button 
                      type="button" 
                      onClick={handleAddStop}
                      className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200"
                    >
                      + Add Stop
                    </button>
                  </div>
                  
                  {formData.additionalStops.map((stop, index) => (
                    <div key={index} className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-4 relative">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveStop(index)}
                        className="absolute top-2 right-2 text-orange-400 hover:text-orange-600"
                      >
                        ✕
                      </button>
                      <div>
                        <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Stop {index + 1} Address</label>
                        <input
                          type="text"
                          value={stop.address}
                          onChange={(e) => handleStopChange(index, 'address', e.target.value)}
                          className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="Street, City, State, ZIP"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Walking Distance (Stop {index + 1})</label>
                        <select
                          value={stop.longCarry}
                          onChange={(e) => handleStopChange(index, 'longCarry', e.target.value as any)}
                          className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
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

              {/* Move Type & Inventory */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-orange-500">Inventory & Logistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type</label>
                    <select
                      value={formData.moveType}
                      onChange={(e) => setFormData({ ...formData, moveType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="storage">Storage Unit</option>
                      <option value="office">Office</option>
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
                  </div>
                </div>
              </section>

              {/* Access */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-orange-500">Access Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <h3 className="font-bold text-gray-600 uppercase text-xs tracking-wider">Origin Access</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Stairs (Flights)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fromStairsFlights}
                          onChange={(e) => setFormData({ ...formData, fromStairsFlights: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <input
                          type="checkbox"
                          id="fromElevator"
                          checked={formData.fromHasElevator}
                          onChange={(e) => setFormData({ ...formData, fromHasElevator: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="fromElevator" className="ml-2 text-sm text-gray-700">Elevator?</label>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <h3 className="font-bold text-gray-600 uppercase text-xs tracking-wider">Destination Access</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Stairs (Flights)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.toStairsFlights}
                          onChange={(e) => setFormData({ ...formData, toStairsFlights: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <input
                          type="checkbox"
                          id="toElevator"
                          checked={formData.toHasElevator}
                          onChange={(e) => setFormData({ ...formData, toHasElevator: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="toElevator" className="ml-2 text-sm text-gray-700">Elevator?</label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Special Items */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-orange-500">Are You Planning on Moving Any of the Following Items?</h2>
                <p className="text-sm text-gray-500 -mt-4 font-bold">Check All That Apply</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specialItemsList.map(item => (
                    <label key={item.id} className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-orange-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.specialItems.includes(item.id)}
                        onChange={() => handleSpecialItemToggle(item.id)}
                        className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <span className="ml-3 text-gray-700 font-medium">{item.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-orange-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.specialItems.length === 0}
                      onChange={() => handleSpecialItemToggle('none')}
                      className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <span className="ml-3 text-gray-700 font-medium">None of the above</span>
                  </label>
                </div>
              </section>

              {/* More Services */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 text-orange-500">Special Services</h2>
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
                  className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-200 disabled:opacity-50"
                >
                  {isCalculating ? 'Calculating...' : 'Get Instant Quote'}
                </button>
              </div>
            </form>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-orange-500">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                  Your Instant Quote
                  {isCalculating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>}
                </h2>

                {quote?.kind === 'instant' && quote.options ? (
                  <div className="space-y-4">
                    {quote.options.map((opt) => (
                      <div key={opt.moverCount} className="p-4 bg-orange-50 rounded-xl border border-orange-100 hover:border-orange-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-lg text-orange-700">{opt.moverCount} Movers</span>
                          <span className="text-sm font-semibold text-gray-500">{Math.round(opt.etaMinutesRange.low / 60)}-{Math.round(opt.etaMinutesRange.high / 60)} hrs</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900">
                          {formatCurrency(opt.priceRange.low * 100)} - {formatCurrency(opt.priceRange.high * 100)}
                        </div>
                        {opt.transportFee > 0 && (
                          <div className="text-[10px] text-gray-400 mt-1">Includes {formatCurrency(opt.transportFee * 100)} transport fee</div>
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
