import { useRef, useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import SignatureCanvas from 'react-signature-canvas'
import { getJob, createFinalPaymentSession, updateJobStatus, getInvoicePreview } from '../../api/jobsApi'
import { formatDateTime, formatCurrency } from '../../lib/format'

// Helper to get the portal base path from current URL
const getPortalBasePath = (pathname: string): string => {
  if (pathname.startsWith('/admin')) return '/admin'
  if (pathname.startsWith('/sales')) return '/sales'
  return '/mover'
}

export default function JobInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const jobId = parseInt(id || '0')
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = getPortalBasePath(location.pathname)

  // Extract tip from URL query params
  const tipAmountCents = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return parseInt(params.get('tip') || '0')
  }, [location.search])
  
  const employeeSigRef = useRef<SignatureCanvas>(null)
  const customerSigRef = useRef<SignatureCanvas>(null)
  
  const [error, setError] = useState<string | null>(null)

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
  })

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['invoice-preview', jobId, tipAmountCents],
    queryFn: () => getInvoicePreview(jobId, tipAmountCents),
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

  if (jobLoading || previewLoading) return <div className="p-8 text-center text-gray-600">Loading invoice details...</div>
  if (!job || !preview) return <div className="p-8 text-center text-red-600">Job not found</div>

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
          <p className="text-sm text-gray-600 mt-1">Start: {formatDateTime(job.actualStartUtc || job.scheduledStartUtc)}</p>
          <p className="text-sm text-gray-600">End: {formatDateTime(job.actualEndUtc || new Date().toISOString())}</p>
        </div>
        <div className="text-right space-y-1">
          <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">Pricing Breakdown</h2>
          <p className="text-gray-600 text-xs italic">
            {preview.billedHours.toFixed(2)} hrs @ {formatCurrency(preview.hourlyRateCents)}/hr ({preview.crewSize} movers)
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Labor Total:</span>
            <span className="font-medium">{formatCurrency(preview.laborAmountCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Trip Fee:</span>
            <span className="font-medium">{formatCurrency(preview.tripFeeCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Special Items:</span>
            <span className="font-medium">{formatCurrency(preview.specialItemsTotalCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Materials:</span>
            <span className="font-medium">{formatCurrency(preview.materialsTotalCents)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1 mt-1">
            <span>Subtotal:</span>
            <span>{formatCurrency(preview.baseAmountCents)}</span>
          </div>
          {tipAmountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Tip:</span>
              <span>{formatCurrency(tipAmountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-red-600">
            <span>Deposit Paid:</span>
            <span>-{formatCurrency(preview.depositAmountCents)}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold text-blue-600 pt-2 border-t-2 border-blue-100">
            <span>Balance:</span>
            <span>{formatCurrency(preview.totalBalanceCents)}</span>
          </div>
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
          onClick={() => navigate(`${basePath}/job/${jobId}/tip`)}
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
