import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { estimateMoveTime } from '../../api/bookingsApi'

export default function EstimatePage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    // Starting location
    fromStreetAddress: '',
    fromZipCode: '',
    fromPropertyType: '',
    fromSize: '',
    fromStories: '1',
    fromParkingDistance: '0',
    fromElevator: false,
    
    // Final location
    toStreetAddress: '',
    toZipCode: '',
    toPropertyType: '',
    toSize: '',
    toStories: '1',
    toParkingDistance: '0',
    toElevator: false,
    
    // Other information
    urgent24Hours: false,
    additionalStops: false,
    needsPacking: false,
    specialItems: [] as string[],
    
    // Booking details
    estimatedHours: '4',
    requestedTrucks: '1',
  })
  
  const [estimatedHours, setEstimatedHours] = useState<number | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate estimated hours when form data changes
  useEffect(() => {
    const calculateEstimation = async () => {
      // Only calculate if we have minimum required fields
      if (!formData.fromPropertyType || !formData.fromSize || !formData.toPropertyType || !formData.toSize) {
        return
      }
      
      setIsCalculating(true)
      try {
        const result = await estimateMoveTime({
          fromPropertyType: formData.fromPropertyType,
          fromSize: formData.fromSize,
          fromStories: parseInt(formData.fromStories) || 1,
          fromParkingDistance: parseInt(formData.fromParkingDistance) || 0,
          fromElevator: formData.fromElevator,
          toPropertyType: formData.toPropertyType,
          toSize: formData.toSize,
          toStories: parseInt(formData.toStories) || 1,
          toParkingDistance: parseInt(formData.toParkingDistance) || 0,
          toElevator: formData.toElevator,
          urgent24Hours: formData.urgent24Hours,
          additionalStops: formData.additionalStops,
          needsPacking: formData.needsPacking,
          specialItems: formData.specialItems,
          requestedTrucks: parseInt(formData.requestedTrucks) || 1,
        })
        setEstimatedHours(result.estimatedHours)
        setFormData(prev => ({ ...prev, estimatedHours: result.estimatedHours.toString() }))
      } catch (error) {
        console.error('Estimation error:', error)
      } finally {
        setIsCalculating(false)
      }
    }
    
    // Debounce the calculation
    const timeoutId = setTimeout(calculateEstimation, 500)
    return () => clearTimeout(timeoutId)
  }, [
    formData.fromPropertyType,
    formData.fromSize,
    formData.fromStories,
    formData.fromParkingDistance,
    formData.fromElevator,
    formData.toPropertyType,
    formData.toSize,
    formData.toStories,
    formData.toParkingDistance,
    formData.toElevator,
    formData.urgent24Hours,
    formData.additionalStops,
    formData.needsPacking,
    formData.specialItems,
    formData.requestedTrucks,
  ])

  const handleSpecialItemToggle = (item: string) => {
    setFormData(prev => ({
      ...prev,
      specialItems: prev.specialItems.includes(item)
        ? prev.specialItems.filter(i => i !== item)
        : [...prev.specialItems, item]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate required fields
    if (!formData.fromPropertyType || !formData.fromSize || !formData.toPropertyType || !formData.toSize) {
      setError('Please fill in all required fields')
      return
    }
    
    if (!estimatedHours) {
      setError('Please wait for the estimate to calculate')
      return
    }
    
    // Store estimate data in sessionStorage
    sessionStorage.setItem('estimateData', JSON.stringify({
      ...formData,
      estimatedHours: estimatedHours,
    }))
    
    // Navigate to checkout page (availability selection removed)
    // Note: startUtc and endUtc will need to be selected on checkout page or passed via query params
    navigate('/checkout')
  }

  // Calculate estimated cost
  const hourlyRate = 100
  const estimatedCost = estimatedHours ? estimatedHours * hourlyRate : 0

  const propertyTypes = ['apartment', 'condo', 'house', 'townhouse', 'mobile_home', 'commercial']
  const propertySizes = [
    'studio',
    '1bedroom',
    '2bedroom',
    '3bedroom',
    '4bedroom',
    '5bedroom',
    'small_house',
    'medium_house',
    'large_house',
    'mansion',
    'small_apartment',
    'medium_apartment',
    'large_apartment',
  ]
  const specialItemsList = [
    'Piano',
    'Pool Table',
    'Safe (over 600 lbs)',
    'Heavy Furniture (over 600 lbs)',
    'Artwork (over $2000)',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Get Your Moving Quote</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}
        
        {/* Estimated Time and Cost Display */}
        {estimatedHours !== null && (
          <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-800 font-medium text-lg">
                  Estimated Move Time: {estimatedHours} hours
                  {isCalculating && <span className="ml-2 text-sm">(calculating...)</span>}
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Estimated Cost: ${estimatedCost.toFixed(2)} (${hourlyRate}/hour)
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-8">
          {/* Starting Location */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Starting Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.fromStreetAddress}
                  onChange={(e) => setFormData({ ...formData, fromStreetAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter Street Address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.fromZipCode}
                  onChange={(e) => setFormData({ ...formData, fromZipCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter Zip Code"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property Type <span className="text-red-500">*</span></label>
                <select
                  value={formData.fromPropertyType}
                  onChange={(e) => setFormData({ ...formData, fromPropertyType: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select Property Type</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Size <span className="text-red-500">*</span></label>
                <select
                  value={formData.fromSize}
                  onChange={(e) => setFormData({ ...formData, fromSize: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                  disabled={!formData.fromPropertyType}
                >
                  <option value="">- Select a Property Type -</option>
                  {formData.fromPropertyType && propertySizes.map(size => (
                    <option key={size} value={size}>{size.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stories <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={formData.fromStories}
                  onChange={(e) => setFormData({ ...formData, fromStories: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter number of stories"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distance Truck Can Park From Door <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={formData.fromParkingDistance}
                  onChange={(e) => setFormData({ ...formData, fromParkingDistance: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter Walk Distance in Feet (approximate)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Elevator Available <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fromElevator"
                      checked={formData.fromElevator === true}
                      onChange={() => setFormData({ ...formData, fromElevator: true })}
                      className="mr-2"
                      required
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fromElevator"
                      checked={formData.fromElevator === false}
                      onChange={() => setFormData({ ...formData, fromElevator: false })}
                      className="mr-2"
                      required
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Final Location */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Final Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Street Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.toStreetAddress}
                  onChange={(e) => setFormData({ ...formData, toStreetAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter Street Address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.toZipCode}
                  onChange={(e) => setFormData({ ...formData, toZipCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter Zip Code"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property Type <span className="text-red-500">*</span></label>
                <select
                  value={formData.toPropertyType}
                  onChange={(e) => setFormData({ ...formData, toPropertyType: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select Property Type</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Size <span className="text-red-500">*</span></label>
                <select
                  value={formData.toSize}
                  onChange={(e) => setFormData({ ...formData, toSize: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                  disabled={!formData.toPropertyType}
                >
                  <option value="">- Select a Property Type -</option>
                  {formData.toPropertyType && propertySizes.map(size => (
                    <option key={size} value={size}>{size.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stories <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={formData.toStories}
                  onChange={(e) => setFormData({ ...formData, toStories: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter number of stories"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distance Truck Can Park From Door <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={formData.toParkingDistance}
                  onChange={(e) => setFormData({ ...formData, toParkingDistance: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter Walk Distance in Feet (approximate)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Elevator Available <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="toElevator"
                      checked={formData.toElevator === true}
                      onChange={() => setFormData({ ...formData, toElevator: true })}
                      className="mr-2"
                      required
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="toElevator"
                      checked={formData.toElevator === false}
                      onChange={() => setFormData({ ...formData, toElevator: false })}
                      className="mr-2"
                      required
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Other Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Other Information</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Is Your Move Happening 24 Hours or Less from Now? <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="urgent24Hours"
                      checked={formData.urgent24Hours === true}
                      onChange={() => setFormData({ ...formData, urgent24Hours: true })}
                      className="mr-2"
                      required
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="urgent24Hours"
                      checked={formData.urgent24Hours === false}
                      onChange={() => setFormData({ ...formData, urgent24Hours: false })}
                      className="mr-2"
                      required
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Are you making any other stops? <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="additionalStops"
                      checked={formData.additionalStops === true}
                      onChange={() => setFormData({ ...formData, additionalStops: true })}
                      className="mr-2"
                      required
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="additionalStops"
                      checked={formData.additionalStops === false}
                      onChange={() => setFormData({ ...formData, additionalStops: false })}
                      className="mr-2"
                      required
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Do You Need Help Packing? <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="needsPacking"
                      checked={formData.needsPacking === true}
                      onChange={() => setFormData({ ...formData, needsPacking: true })}
                      className="mr-2"
                      required
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="needsPacking"
                      checked={formData.needsPacking === false}
                      onChange={() => setFormData({ ...formData, needsPacking: false })}
                      className="mr-2"
                      required
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Are You Planning on Moving Any of the Following Items? Check All That Apply</label>
                <div className="space-y-2 mt-2">
                  {specialItemsList.map(item => (
                    <label key={item} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specialItems.includes(item)}
                        onChange={() => handleSpecialItemToggle(item)}
                        className="mr-2"
                      />
                      {item}
                    </label>
                  ))}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specialItems.length === 0}
                      onChange={() => setFormData({ ...formData, specialItems: [] })}
                      className="mr-2"
                    />
                    None of the above
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Number of Trucks */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Number of Trucks <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.requestedTrucks}
              onChange={(e) => setFormData({ ...formData, requestedTrucks: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of trucks needed for this move
            </p>
          </div>

          <button
            type="submit"
            disabled={!estimatedHours || isCalculating}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold"
          >
            {isCalculating ? 'Calculating...' : estimatedHours ? 'Select Availability' : 'Fill Form to Get Estimate'}
          </button>
        </form>
      </div>
    </div>
  )
}
