import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { formatDateTime } from '../../lib/format'

export default function QuotePage() {
  const [searchParams] = useSearchParams()
  const startUtc = searchParams.get('startUtc') || ''
  const endUtc = searchParams.get('endUtc') || ''
  const estimatedHours = parseFloat(searchParams.get('estimatedHours') || '4')

  // Load Stripe buy button script
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')
    if (existingScript) {
      return // Script already exists, don't add another
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/buy-button.js'
    script.async = true
    document.body.appendChild(script)

    // Note: We don't remove the script on unmount since it might be used by other components
    // and Stripe scripts are typically safe to leave in the DOM
  }, [])

  // Calculate estimated cost (you can adjust this formula based on your pricing)
  // Example: $100/hour base rate
  const hourlyRate = 100
  const estimatedCost = estimatedHours * hourlyRate

  if (!startUtc || !endUtc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Quote</h1>
            <p className="text-gray-600">
              Missing required information. Please go back and select a time slot.
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
          <h1 className="text-3xl font-bold mb-6 text-center">Your Moving Quote</h1>
          
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

          {/* Book Now Button */}
          <div className="text-center">
            <stripe-buy-button
              buy-button-id="buy_btn_1SpvD5RoTKuWjkUYScyyXtZt"
              publishable-key="pk_test_51Spt6aRoTKuWjkUYHF3DgqvtY4SqV88P7DvvXhnRnQ2BlrU98jz4BvM4JoAs5GjvKwxGoAlwv6pPHVoZIq3Y3WG100EQsPPECK"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
