import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { updateJobStatus } from '../../api/jobsApi'

// Helper to get the portal base path from current URL
const getPortalBasePath = (pathname: string): string => {
  if (pathname.startsWith('/admin')) return '/admin'
  if (pathname.startsWith('/sales')) return '/sales'
  return '/mover'
}

// Get the jobs list path for each portal
const getJobsListPath = (basePath: string): string => {
  if (basePath === '/admin') return '/admin/jobs'
  if (basePath === '/sales') return '/sales/jobs'
  return '/mover/dispatch'
}

export default function PaymentSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const basePath = getPortalBasePath(location.pathname)
  const jobsListPath = getJobsListPath(basePath)
  const jobId = parseInt(id || '0')
  const [status, setStatus] = useState<'updating' | 'success' | 'error'>('updating')

  useEffect(() => {
    const finalizeJob = async () => {
      try {
        await updateJobStatus(jobId, 'completed')
        setStatus('success')
      } catch (error) {
        console.error('Finalization error:', error)
        setStatus('error')
      }
    }
    finalizeJob()
  }, [jobId])

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow rounded-lg text-center my-12">
      {status === 'updating' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Processing...</h1>
          <p className="text-gray-600">Finalizing job status.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">The job has been marked as completed.</p>
          <Link
            to={jobsListPath}
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Back to Jobs
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="rounded-full bg-red-100 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-red-700">Something went wrong</h1>
          <p className="text-gray-600 mb-8">Payment was successful, but we couldn't update the job status automatically.</p>
          <Link
            to={`${basePath}/job/${jobId}`}
            className="block w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            Retry manually in Job Details
          </Link>
        </>
      )}
    </div>
  )
}
