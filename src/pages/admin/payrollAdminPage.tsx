export default function PayrollAdminPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <svg className="mx-auto h-24 w-24 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payroll Administration</h1>
        <p className="text-lg text-gray-600 mb-8">
          Advanced payroll and commission management tools are coming soon!
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-purple-800">
            <strong>Coming Soon:</strong> Comprehensive payroll dashboards, commission tracking,
            detailed earnings reports, and advanced user filtering for sales and employee payroll management.
          </p>
        </div>
      </div>
    </div>
  )
}