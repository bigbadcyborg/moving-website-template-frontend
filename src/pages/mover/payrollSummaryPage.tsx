export default function PayrollSummaryPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <svg className="mx-auto h-24 w-24 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payroll Summary</h1>
        <p className="text-lg text-gray-600 mb-8">
          Detailed payroll tracking and summary reports are coming soon!
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            <strong>Coming Soon:</strong> View your hours worked, earnings breakdown, tip distribution,
            and detailed payroll summaries for each completed job.
          </p>
        </div>
      </div>
    </div>
  )
}
