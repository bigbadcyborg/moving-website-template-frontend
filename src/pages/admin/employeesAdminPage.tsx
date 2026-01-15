import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmployees, createEmployee, Employee, EmployeeCreate } from '../../api/employeesApi'
import { getUsers, User } from '../../api/adminApi'
import { formatCurrency, centsToDollars, dollarsToCents } from '../../lib/format'

export default function EmployeesAdminPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<EmployeeCreate>({
    userId: 0,
    employeeNumber: '',
    hourlyRateCents: 0,
    isManager: false,
  })
  const [hourlyRateDollars, setHourlyRateDollars] = useState<number | ''>('')

  const queryClient = useQueryClient()

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowAddForm(false)
      setHourlyRateDollars('')
      setFormData({
        userId: 0,
        employeeNumber: '',
        hourlyRateCents: 0,
        isManager: false,
      })
      alert('Employee created successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId || hourlyRateDollars === '' || (typeof hourlyRateDollars === 'number' && hourlyRateDollars <= 0)) {
      alert('Please select a user and enter a valid hourly rate')
      return
    }
    createMutation.mutate({
      ...formData,
      hourlyRateCents: dollarsToCents(hourlyRateDollars),
      employeeNumber: formData.employeeNumber || undefined,
    })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setHourlyRateDollars('')
    setFormData({
      userId: 0,
      employeeNumber: '',
      hourlyRateCents: 0,
      isManager: false,
    })
  }

  // Filter out users who already have employee records
  const availableUsers = users?.filter(
    (user) => !employees?.some((emp) => emp.userId === user.id)
  ) || []

  if (employeesLoading || usersLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Employee
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                User <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value={0}>Select a user</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
              {availableUsers.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  All users already have employee records
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Employee Number (optional)
              </label>
              <input
                type="text"
                value={formData.employeeNumber}
                onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., EMP001"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Hourly Rate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={hourlyRateDollars}
                  onChange={(e) => {
                    const val = e.target.value
                    setHourlyRateDollars(val === '' ? '' : parseFloat(val))
                  }}
                  className="w-full pl-7 pr-3 py-2 border rounded"
                  placeholder="25.00"
                  required
                />
              </div>
              {hourlyRateDollars !== '' && typeof hourlyRateDollars === 'number' && hourlyRateDollars > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(dollarsToCents(hourlyRateDollars))} per hour
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isManager}
                  onChange={(e) => setFormData({ ...formData, isManager: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Manager</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || availableUsers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Employee'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Existing Employees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
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
                    {employee.employeeNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {employee.userId}
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
              No employees found. Add your first employee above.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
