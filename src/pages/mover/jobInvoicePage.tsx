import { useRef, useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import SignatureCanvas from 'react-signature-canvas'
import { getJob, createFinalPaymentSession, updateJobStatus } from '../../api/jobsApi'
import { formatDateTime, formatCurrency } from '../../lib/format'

export default function JobInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const jobId = parseInt(id || '0')
  const navigate = useNavigate()
  const location = useLocation()

  // Extract tip from URL query params
  const tipAmountCents = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return parseInt(params.get('tip') || '0')
  }, [location.search])
  
  const employeeSigRef = useRef<SignatureCanvas>(null)
  const customerSigRef = useRef<SignatureCanvas>(null)
  
  const [error, setError] = useState<string | null>(null)

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
  })

  const paymentMutation = useMutation({
    mutationFn: () => createFinalPaymentSession(jobId, tipAmountCents),
    onSuccess: (data) => {
      // Set status to paymentPending before redirecting
      updateJobStatus(jobId, 'paymentPending').then(() => {
        window.location.href = data.checkoutUrl
      })
    },
    onError: (error: Error) => {
      setError(`Payment Error: ${error.message}`)
    },
  })

  if (isLoading) return <div className="p-8 text-center text-gray-600">Loading invoice details...</div>
  if (!job) return <div className="p-8 text-center text-red-600">Job not found</div>

  // Total calculation logic
  const startTime = job.actualStartUtc ? new Date(job.actualStartUtc) : new Date(job.scheduledStartUtc)
  const endTime = job.actualEndUtc ? new Date(job.actualEndUtc) : new Date()
  const durationMs = endTime.getTime() - startTime.getTime()
  const hours = Math.max(1.0, durationMs / (1000 * 60 * 60))
  const hourlyRate = 10000 // $100.00
  const baseTotalCents = Math.round(hours * hourlyRate)
  const finalTotalCents = baseTotalCents + tipAmountCents

  const handleProceedToPayment = () => {
    setError(null)
    if (employeeSigRef.current?.isEmpty()) {
      setError('Employee signature is required')
      return
    }
    if (customerSigRef.current?.isEmpty()) {
      setError('Customer signature is required')
      return
    }
    
    // In a real app, we would upload these signatures to a storage bucket
    console.log('Employee Signature:', employeeSigRef.current?.toDataURL())
    console.log('Customer Signature:', customerSigRef.current?.toDataURL())
    
    paymentMutation.mutate()
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center border-b pb-4">Move Invoice Summary</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">Job Information</h2>
          <p className="text-lg font-medium">Job #{job.id}</p>
          {job.booking && <p className="text-gray-700">{job.booking.customerName}</p>}
          <p className="text-sm text-gray-600 mt-1">Start: {formatDateTime(startTime.toISOString())}</p>
          <p className="text-sm text-gray-600">End: {formatDateTime(endTime.toISOString())}</p>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">Pricing</h2>
          <p className="text-gray-700 text-sm">Move Duration: {hours.toFixed(2)} hours</p>
          <p className="text-gray-700 text-sm">Hourly Rate: $100.00/hr</p>
          <p className="text-gray-700 font-medium">Base Total: {formatCurrency(baseTotalCents)}</p>
          {tipAmountCents > 0 && (
            <p className="text-green-600 font-medium">Tip: {formatCurrency(tipAmountCents)}</p>
          )}
          <p className="text-2xl font-bold text-blue-600 mt-2">Total: {formatCurrency(finalTotalCents)}</p>
        </div>
      </div>

      <div className="space-y-8 mb-8 border-t pt-8">
        <div>
          <h2 className="font-semibold mb-2 flex justify-between items-center">
            <span>Employee Signature</span>
            <button 
              onClick={() => employeeSigRef.current?.clear()} 
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          </h2>
          <div className="border rounded bg-gray-50">
            <SignatureCanvas 
              ref={employeeSigRef}
              penColor="black"
              canvasProps={{ className: 'w-full h-40' }}
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2 flex justify-between items-center">
            <span>Customer Signature</span>
            <button 
              onClick={() => customerSigRef.current?.clear()} 
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          </h2>
          <div className="border rounded bg-gray-50">
            <SignatureCanvas 
              ref={customerSigRef}
              penColor="black"
              canvasProps={{ className: 'w-full h-40' }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate(`/mover/job/${jobId}/tip`)}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Change Tip
        </button>
        <button
          onClick={handleProceedToPayment}
          disabled={paymentMutation.isPending}
          className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold text-lg shadow-md"
        >
          {paymentMutation.isPending ? 'Redirecting to Stripe...' : 'Sign & Proceed to Payment'}
        </button>
      </div>
    </div>
  )
}
