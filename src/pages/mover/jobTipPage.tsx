import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getJob } from '../../api/jobsApi'
import { formatCurrency } from '../../lib/format'

export default function JobTipPage() {
  const { id } = useParams<{ id: string }>()
  const jobId = parseInt(id || '0')
  const navigate = useNavigate()
  
  const [customTip, setCustomTip] = useState<string>('')
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null)

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
  })

  if (isLoading) return <div className="p-8 text-center text-gray-600">Loading details...</div>
  if (!job) return <div className="p-8 text-center text-red-600">Job not found</div>

  // Base total calculation for tip suggestion
  const startTime = job.actualStartUtc ? new Date(job.actualStartUtc) : new Date(job.scheduledStartUtc)
  const endTime = new Date() // Current time for estimation
  const durationMs = endTime.getTime() - startTime.getTime()
  const hours = Math.max(1.0, durationMs / (1000 * 60 * 60))
  const hourlyRate = 10000 // $100.00
  const baseTotalCents = Math.round(hours * hourlyRate)

  const handleSelectTip = (percentage: number) => {
    setSelectedPercentage(percentage)
    setCustomTip('')
  }

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value)
    setSelectedPercentage(null)
  }

  const getTipAmountCents = () => {
    if (selectedPercentage !== null) {
      return Math.round(baseTotalCents * (selectedPercentage / 100))
    }
    const customValue = parseFloat(customTip)
    return isNaN(customValue) ? 0 : Math.round(customValue * 100)
  }

  const tipAmountCents = getTipAmountCents()

  const handleContinue = () => {
    navigate(`/mover/job/${jobId}/invoice?tip=${tipAmountCents}`)
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg my-12">
      <h1 className="text-2xl font-bold mb-2 text-center">Add a Tip?</h1>
      <p className="text-gray-600 text-center mb-8">Show your appreciation for the hard work!</p>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
        <p className="text-sm text-blue-700 uppercase font-semibold tracking-wider">Move Base Total</p>
        <p className="text-2xl font-bold text-blue-900">{formatCurrency(baseTotalCents)}</p>
        <p className="text-xs text-blue-600 mt-1">Based on {hours.toFixed(1)} hours of work</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[10, 15, 20].map((percent) => (
          <button
            key={percent}
            onClick={() => handleSelectTip(percent)}
            className={`py-3 rounded-lg border-2 transition-all ${
              selectedPercentage === percent
                ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                : 'border-gray-200 hover:border-blue-300 text-gray-700'
            }`}
          >
            {percent}%
            <div className="text-[10px] font-normal">
              {formatCurrency(Math.round(baseTotalCents * (percent / 100)))}
            </div>
          </button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Tip Amount ($)</label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
          <input
            type="number"
            value={customTip}
            onChange={(e) => handleCustomTipChange(e.target.value)}
            placeholder="0.00"
            className="w-full pl-7 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleContinue}
          className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg"
        >
          {tipAmountCents > 0 ? `Add ${formatCurrency(tipAmountCents)} Tip & Continue` : 'No Tip, Continue to Signature'}
        </button>
        <button
          onClick={() => navigate(`/mover/job/${jobId}`)}
          className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
