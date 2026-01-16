import { useQuery } from '@tanstack/react-query'
import { getEmployees } from '../../api/employeesApi'
import { formatCurrency } from '../../lib/format'

export default function EmployeesAdminPage() {
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  if (employeesLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Existing Employees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees?.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium">
                      {employee.userFullName || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.userEmail || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.employeeNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(employee.hourlyRateCents)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.isManager ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees?.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No employees found. Employees are created when you add employee information to users in the Users tab.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
