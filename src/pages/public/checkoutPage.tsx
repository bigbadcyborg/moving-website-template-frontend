import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createPublicBooking } from '../../api/bookingsApi'
import { formatDateTime } from '../../lib/format'

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const startUtc = searchParams.get('startUtc') || ''
  const endUtc = searchParams.get('endUtc') || ''
  const requestedTrucks = parseInt(searchParams.get('requestedTrucks') || '1')

  // Get estimate data from sessionStorage
  const estimateData = useMemo(() => {
    const stored = sessionStorage.getItem('estimateData')
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }, [])

  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [bookingCreated, setBookingCreated] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const stripeButtonRef = useRef<HTMLDivElement>(null)

  // Redirect if missing required data
  useEffect(() => {
    if (!estimateData) {
      navigate('/estimate')
      return
    }
    // If startUtc/endUtc are missing, they should be selected on this page or passed from estimate
    // For now, redirect to estimate if missing
    if (!startUtc || !endUtc) {
      navigate('/estimate')
      return
    }
  }, [startUtc, endUtc, estimateData, navigate])

  // Render Stripe Buy Button when booking is created
  useEffect(() => {
    if (bookingCreated && stripeButtonRef.current) {
      // Clear any existing content
      stripeButtonRef.current.innerHTML = ''
      
      // Check if Stripe script is loaded
      if (typeof window !== 'undefined' && window.customElements && window.customElements.get('stripe-buy-button')) {
        // Create the stripe-buy-button element
        const buyButton = document.createElement('stripe-buy-button')
        buyButton.setAttribute('buy-button-id', 'buy_btn_1SpvD5RoTKuWjkUYScyyXtZt')
        buyButton.setAttribute('publishable-key', 'pk_test_51Spt6aRoTKuWjkUYHF3DgqvtY4SqV88P7DvvXhnRnQ2BlrU98jz4BvM4JoAs5GjvKwxGoAlwv6pPHVoZIq3Y3WG100EQsPPECK')
        
        stripeButtonRef.current.appendChild(buyButton)
      } else {
        // Stripe script not loaded (likely blocked by ad blocker)
        stripeButtonRef.current.innerHTML = `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-yellow-800 font-semibold mb-2">Payment Button Blocked</p>
            <p class="text-yellow-700 text-sm mb-3">
              Your browser or ad blocker is preventing the payment button from loading. 
              Please disable your ad blocker for this site or use a different browser.
            </p>
            <p class="text-yellow-700 text-sm">
              Your booking (#${bookingId}) has been created successfully. 
              Please contact us to complete payment.
            </p>
          </div>
        `
      }
    }
  }, [bookingCreated, bookingId])

  // Calculate estimated cost
  const hourlyRate = 100
  const estimatedHours = estimateData?.estimatedHours || 4
  const estimatedCost = estimatedHours * hourlyRate

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!estimateData) {
        throw new Error('Missing estimate data')
      }

      // Construct full addresses from street address and zip code
      const moveFromAddress = estimateData.fromStreetAddress 
        ? `${estimateData.fromStreetAddress}, ${estimateData.fromZipCode || ''}`.trim()
        : ''
      const moveToAddress = estimateData.toStreetAddress
        ? `${estimateData.toStreetAddress}, ${estimateData.toZipCode || ''}`.trim()
        : ''

      const bookingData: any = {
        startUtc,
        endUtc,
        requestedTrucks: requestedTrucks || parseInt(estimateData.requestedTrucks) || 1,
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        moveFromAddress,
        moveToAddress,
        notes: estimateData.notes || undefined,
        // Move details - Starting location
        fromStreetAddress: estimateData.fromStreetAddress || undefined,
        fromZipCode: estimateData.fromZipCode || undefined,
        fromPropertyType: estimateData.fromPropertyType || undefined,
        fromSize: estimateData.fromSize || undefined,
        fromStories: estimateData.fromStories ? parseInt(estimateData.fromStories) : undefined,
        fromParkingDistance: estimateData.fromParkingDistance ? parseInt(estimateData.fromParkingDistance) : undefined,
        fromElevator: estimateData.fromElevator || undefined,
        // Move details - Final location
        toStreetAddress: estimateData.toStreetAddress || undefined,
        toZipCode: estimateData.toZipCode || undefined,
        toPropertyType: estimateData.toPropertyType || undefined,
        toSize: estimateData.toSize || undefined,
        toStories: estimateData.toStories ? parseInt(estimateData.toStories) : undefined,
        toParkingDistance: estimateData.toParkingDistance ? parseInt(estimateData.toParkingDistance) : undefined,
        toElevator: estimateData.toElevator || undefined,
        // Other information
        urgent24Hours: estimateData.urgent24Hours || undefined,
        additionalStops: estimateData.additionalStops || undefined,
        needsPacking: estimateData.needsPacking || undefined,
        specialItems: estimateData.specialItems && estimateData.specialItems.length > 0 ? estimateData.specialItems : undefined,
        estimatedHours: parseFloat(estimateData.estimatedHours) || undefined,
      }

      return createPublicBooking(bookingData)
    },
    onSuccess: (data) => {
      setError(null)
      // Store booking ID and mark booking as created
      if (data.bookingId) {
        setBookingId(data.bookingId)
        setBookingCreated(true)
      } else {
        setError('Booking created but payment link not available. Please contact support.')
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to create booking. Please try again.'
      setError(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    bookingMutation.mutate()
  }

  if (!startUtc || !endUtc || !estimateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Missing Information</h1>
            <p className="text-gray-600">
              Please go back and complete the estimate and availability selection.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Complete Your Booking</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Time Range */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-blue-900">Scheduled Time</h2>
            <div className="space-y-1 text-blue-800">
              <p><span className="font-medium">Start:</span> {formatDateTime(startUtc)}</p>
              <p><span className="font-medium">End:</span> {formatDateTime(endUtc)}</p>
              <p><span className="font-medium">Estimated Duration:</span> {estimatedHours} hours</p>
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-green-900">Estimated Cost</h2>
            <p className="text-3xl font-bold text-green-800">
              ${estimatedCost.toFixed(2)}
            </p>
            <p className="text-sm text-green-700 mt-1">
              Based on {estimatedHours} hours at ${hourlyRate}/hour
            </p>
          </div>

          {/* Customer Information Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={customerInfo.customerName}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={customerInfo.customerEmail}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={customerInfo.customerPhone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            {!bookingCreated ? (
              <button
                type="submit"
                disabled={bookingMutation.isPending}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold mt-6"
              >
                {bookingMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
              </button>
            ) : (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
                <p className="text-gray-600 mb-4">Your booking has been created. Please complete payment below:</p>
                <div ref={stripeButtonRef}></div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
