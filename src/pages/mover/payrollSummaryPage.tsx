import { useQuery } from '@tanstack/react-query'
import { getPayrollSummary } from '../../api/payrollApi'
import { formatCurrency } from '../../lib/format'
import { subDays } from 'date-fns'

export default function PayrollSummaryPage() {
  const periodEnd = new Date()
  const periodStart = subDays(periodEnd, 14)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['payroll', periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: () => getPayrollSummary(periodStart.toISOString(), periodEnd.toISOString()),
  })

  if (isLoading) return <div>Loading payroll summary...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payroll Summary</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Estimated Pay</th>
            </tr>
          </thead>
          <tbody>
            {summary?.map((item) => (
              <tr key={item.employeeId} className="border-t">
                <td className="px-6 py-4">{item.employeeNumber || `Employee ${item.employeeId}`}</td>
                <td className="px-6 py-4">{item.totalHours.toFixed(2)}</td>
                <td className="px-6 py-4">{formatCurrency(item.hourlyRateCents)}/hr</td>
                <td className="px-6 py-4 font-medium">{formatCurrency(item.estimatedPayCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
