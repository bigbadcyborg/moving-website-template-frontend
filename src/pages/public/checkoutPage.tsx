import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createPublicBooking } from '../../api/bookingsApi'
import { formatDateTime, formatCurrency } from '../../lib/format'

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const startUtc = searchParams.get('startUtc') || ''
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
    customerName: estimateData?.customerName || '',
    customerEmail: estimateData?.customerEmail || '',
    customerPhone: estimateData?.customerPhone || '',
    notes: estimateData?.notes || '',
  })

  const [error, setError] = useState<string | null>(null)
  const [bookingCreated, setBookingCreated] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [expiresAtUtc, setExpiresAtUtc] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const stripeButtonRef = useRef<HTMLDivElement>(null)

  // Countdown timer logic
  useEffect(() => {
    if (!expiresAtUtc) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAtUtc).getTime()
      const diff = Math.max(0, Math.floor((expiry - now) / 1000))
      
      setTimeLeft(diff)
      
      if (diff === 0) {
        clearInterval(interval)
        setError('Your session has expired. Please refresh the page to try again.')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAtUtc])

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Redirect if missing required data
  useEffect(() => {
    if (!estimateData) {
      navigate('/estimate')
      return
    }
    // If startUtc is missing, they need to select it (unless coming from direct estimate)
    if (!startUtc && !estimateData.startUtc) {
      navigate('/customer/availability')
      return
    }
  }, [startUtc, estimateData, navigate])

  const bookingStartUtc = startUtc || estimateData?.startUtc
  const quote = estimateData?.quote
  const selectedMoverCount = estimateData?.selectedMoverCount || 2

  // Find the selected quote option
  const selectedOption = useMemo(() => {
    if (quote?.kind === 'instant' && quote.options) {
      return quote.options.find((opt: any) => opt.moverCount === selectedMoverCount) || quote.options[0]
    }
    return null
  }, [quote, selectedMoverCount])

  // Save startUtc to sessionStorage if it came from URL but isn't in storage yet
  useEffect(() => {
    if (startUtc && estimateData && !estimateData.startUtc) {
      sessionStorage.setItem('estimateData', JSON.stringify({
        ...estimateData,
        startUtc: startUtc
      }))
    }
  }, [startUtc, estimateData])

  // Render Stripe Buy Button when booking is created
  useEffect(() => {
    if (bookingCreated && stripeButtonRef.current) {
      stripeButtonRef.current.innerHTML = ''
      if (typeof window !== 'undefined' && window.customElements && window.customElements.get('stripe-buy-button')) {
        const buyButton = document.createElement('stripe-buy-button')
        buyButton.setAttribute('buy-button-id', 'buy_btn_1SpvD5RoTKuWjkUYScyyXtZt')
        buyButton.setAttribute('publishable-key', 'pk_test_51Spt6aRoTKuWjkUYHF3DgqvtY4SqV88P7DvvXhnRnQ2BlrU98jz4BvM4JoAs5GjvKwxGoAlwv6pPHVoZIq3Y3WG100EQsPPECK')
        stripeButtonRef.current.appendChild(buyButton)
      } else {
        stripeButtonRef.current.innerHTML = `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-yellow-800 font-semibold mb-2">Payment Button Blocked</p>
            <p class="text-yellow-700 text-sm mb-3">Your ad blocker is preventing the payment button from loading.</p>
            <p class="text-yellow-700 text-sm">Your booking (#${bookingId}) is created. Please contact us to complete payment.</p>
          </div>
        `
      }
    }
  }, [bookingCreated, bookingId])

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!estimateData || !quote) {
        throw new Error('Missing estimate or quote data')
      }

      // Calculate endUtc based on estimate (default to 4 hours if not in quote)
      const durationHours = selectedOption?.etaMinutesRange.high / 60 || 4
      const start = new Date(bookingStartUtc)
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)

      // Remove additionalStops array from estimateData to avoid conflict with boolean field in schema
      const { additionalStops, ...restEstimateData } = estimateData;

      // Format additional details for notes
      let detailedNotes = customerInfo.notes || ''
      if (estimateData.additionalStops?.length > 0) {
        detailedNotes += '\n\nAdditional Stops:\n'
        estimateData.additionalStops.forEach((stop: any, i: number) => {
          detailedNotes += `${i+1}. ${stop.address}\n`
        })
      }
      if (estimateData.specialItems?.length > 0) {
        detailedNotes += '\n\nSpecial Items: ' + estimateData.specialItems.join(', ')
      }
      
      detailedNotes += '\n\nCrew Size: ' + selectedMoverCount + ' Movers'

      // Calculate min and max duration hours from estimate
      const durationHoursMin = selectedOption?.etaMinutesRange.low / 60 || durationHours
      const durationHoursMax = selectedOption?.etaMinutesRange.high / 60 || durationHours

      const bookingData: any = {
        ...restEstimateData,
        additionalStops: (estimateData.additionalStops?.length || 0) > 0,
        startUtc: bookingStartUtc,
        endUtc: end.toISOString(),
        requestedTrucks: estimateData.requestedTrucks || requestedTrucks || 1,
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        moveFromAddress: estimateData.originAddress,
        moveToAddress: estimateData.destinationAddress,
        estimatedHours: durationHours,
        estimatedHoursMin: durationHoursMin,
        estimatedHoursMax: durationHoursMax,
        notes: detailedNotes.trim(),
        additionalStopsDetailed: JSON.stringify(estimateData.additionalStops || []),
      }

      return createPublicBooking(bookingData)
    },
    onSuccess: (data) => {
      setError(null)
      if (data.bookingId) {
        setBookingId(data.bookingId)
        if (data.expiresAtUtc) {
          setExpiresAtUtc(data.expiresAtUtc)
        }
        if (data.checkoutUrl) {
          setCheckoutUrl(data.checkoutUrl)
          // Redirect to Stripe Checkout automatically
          window.location.href = data.checkoutUrl
        } else {
          setBookingCreated(true)
        }
      } else {
        setError('Booking created but payment link not available.')
      }
    },
    onError: (error: Error) => {
      setError(error.message || 'Failed to create booking.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    bookingMutation.mutate()
  }

  if (!bookingStartUtc || !estimateData || !quote) {
    return <div className="p-12 text-center">Loading booking details...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white relative">
            <h1 className="text-3xl font-bold">Secure Your Move</h1>
            <p className="opacity-90 mt-2 text-lg">Review your details and pay the deposit to confirm.</p>
            {timeLeft !== null && timeLeft > 0 && (
              <div className="absolute top-8 right-8 bg-blue-500/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <p className="text-xs uppercase font-bold tracking-wider opacity-80">Hold expires in</p>
                <p className="text-2xl font-mono font-bold leading-none">{formatTimeLeft(timeLeft)}</p>
              </div>
            )}
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Move Summary</h2>
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-500 font-medium">Arrival:</span> <span className="font-bold">{formatDateTime(bookingStartUtc)}</span></p>
                  {selectedOption && (
                    <p><span className="text-gray-500 font-medium">Est. Duration:</span> <span className="font-bold">
                      {(() => {
                        const low = Math.round(selectedOption.etaMinutesRange.low / 60)
                        const high = Math.round(selectedOption.etaMinutesRange.high / 60)
                        return high <= low ? `${low}-${low + 1}` : `${low}-${high}`
                      })()} hrs
                    </span></p>
                  )}
                  <p><span className="text-gray-500 font-medium">From:</span> <span className="font-bold">{estimateData.originAddress}</span></p>
                  <p><span className="text-gray-500 font-medium">To:</span> <span className="font-bold">{estimateData.destinationAddress}</span></p>
                  <p><span className="text-gray-500 font-medium">Type:</span> <span className="font-bold capitalize">{estimateData.moveType}</span></p>
                  <p><span className="text-gray-500 font-medium">Bedrooms:</span> <span className="font-bold">{estimateData.bedroomsWithMattresses}</span></p>
                  <p><span className="text-gray-500 font-medium">Boxes:</span> <span className="font-bold">{estimateData.boxCount}</span></p>
                  <p><span className="text-gray-500 font-medium">Trucks:</span> <span className="font-bold">{estimateData.requestedTrucks || 1}</span></p>
                  {estimateData.additionalStops?.length > 0 && (
                    <p><span className="text-gray-500 font-medium">Extra Stops:</span> <span className="font-bold">{estimateData.additionalStops.length}</span></p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Estimated Pricing</h2>
                {selectedOption && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-xs text-blue-600 uppercase font-bold mb-1">
                      {selectedMoverCount} Mover Estimate ({(() => {
                        const low = Math.round(selectedOption.etaMinutesRange.low / 60)
                        const high = Math.round(selectedOption.etaMinutesRange.high / 60)
                        return high <= low ? `${low}-${low + 1}` : `${low}-${high}`
                      })()} hrs)
                    </p>
                    <p className="text-2xl font-black text-blue-900">
                      {formatCurrency(selectedOption.priceRange.low * 100)} - {formatCurrency(selectedOption.priceRange.high * 100)}
                    </p>
                    <p className="text-[10px] text-blue-500 mt-2 italic">* Total based on actual hours. Transport fee included.</p>
                  </div>
                )}
                {quote.kind === 'manual' && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <p className="text-yellow-800 font-bold">Manual Quote Pending</p>
                    <p className="text-xs text-yellow-700">A deposit is still required to hold your slot. We will contact you with final pricing.</p>
                  </div>
                )}
              </div>
            </div>

            {!bookingCreated ? (
              <form onSubmit={handleSubmit} className="space-y-6 border-t pt-8">
                <h2 className="text-xl font-bold text-gray-800">Your Contact Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={customerInfo.customerName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, customerName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={customerInfo.customerEmail}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, customerEmail: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={customerInfo.customerPhone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, customerPhone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Special Instructions / Notes</label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Any specific items we should know about? Parking instructions?"
                    />
                  </div>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl text-center">
                  <p className="text-gray-600 mb-4">A <span className="font-bold text-gray-900">$100.00 deposit</span> is required to reserve your slot.</p>
                  <button
                    type="submit"
                    disabled={bookingMutation.isPending}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                  >
                    {bookingMutation.isPending ? 'Reserving...' : (quote.kind === 'manual' ? 'Request Manual Review' : 'Confirm & Pay Deposit')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center border-t pt-8 animate-in fade-in">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Reserved!</h2>
                {checkoutUrl ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">Redirecting to secure payment...</p>
                    <a 
                      href={checkoutUrl}
                      className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg"
                    >
                      Click here if not redirected
                    </a>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600">Please complete the payment below to finalize your reservation.</p>
                    <div ref={stripeButtonRef} className="max-w-xs mx-auto"></div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
