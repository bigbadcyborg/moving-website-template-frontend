import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, resetUserPassword, deleteUser, User, UserCreate, UserUpdate } from '../../api/adminApi'
import { getCurrentUser } from '../../api/authApi'
import { formatCurrency, centsToDollars, dollarsToCents } from '../../lib/format'

const ROLES = ['customer', 'sales', 'mover', 'admin'] as const

export default function UserManagementPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    password: '',
    fullName: '',
    role: 'customer',
  })
  const [editData, setEditData] = useState<UserUpdate>({})
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowAddForm(false)
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'customer',
      })
      alert('User created successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UserUpdate }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
      setEditData({})
      alert('User updated successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      resetUserPassword(userId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowResetPasswordModal(false)
      setResetPasswordUserId(null)
      setNewPassword('')
      setConfirmPassword('')
      alert('Password reset successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      alert('User deleted successfully')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (!resetPasswordUserId) return
    resetPasswordMutation.mutate({ userId: resetPasswordUserId, password: newPassword })
  }

  const handleDeleteUser = (user: User) => {
    if (currentUser && user.id === currentUser.id) {
      alert('You cannot delete your own account')
      return
    }
    if (confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.fullName) {
      alert('Please fill in all required fields')
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    const updateData: UserUpdate = { ...editData }
    
    // Convert hourly rate dollars to cents if provided
    if ((editingUser.role === 'mover' || editingUser.employeeId) && hourlyRateDollars !== '') {
      updateData.hourlyRateCents = dollarsToCents(hourlyRateDollars)
    }
    
    updateMutation.mutate({ userId: editingUser.id, data: updateData })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingUser(null)
    setHourlyRateDollars('')
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'customer',
    })
    setEditData({})
  }

  const [hourlyRateDollars, setHourlyRateDollars] = useState<number | ''>('')

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setHourlyRateDollars(centsToDollars(user.hourlyRateCents))
    setEditData({
      role: user.role,
      isActive: user.isActive,
      fullName: user.fullName,
    })
    setShowAddForm(false)
  }

  const handleResetPasswordClick = (user: User) => {
    setResetPasswordUserId(user.id)
    setNewPassword('')
    setConfirmPassword('')
    setShowResetPasswordModal(true)
  }


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'sales':
        return 'bg-blue-100 text-blue-800'
      case 'mover':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRoleDisplay = (role: string) => {
    if (role === 'mover') {
      return 'Employee'
    }
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        {!showAddForm && !editingUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add User
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New User</h2>
          <form onSubmit={handleCreateSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                minLength={6}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleDisplay(role)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
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

      {editingUser && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit User: {editingUser.email}</h2>
          <form onSubmit={handleUpdateSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={editingUser.email}
                className="w-full px-3 py-2 border rounded bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={editData.fullName || editingUser.fullName}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={editData.role || editingUser.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleDisplay(role)}
                  </option>
                ))}
              </select>
            </div>

            {(editingUser.role === 'mover' || editingUser.employeeId) && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Hourly Rate</label>
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
                  />
                </div>
                {editingUser.hourlyRateCents && (
                  <p className="text-xs text-gray-500 mt-1">Current: {formatCurrency(editingUser.hourlyRateCents)}/hour</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editData.isActive !== undefined ? editData.isActive : editingUser.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="mb-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => handleResetPasswordClick(editingUser)}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
              >
                Reset Password
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update User'}
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
          <h2 className="text-lg font-semibold">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${getRoleColor(user.role)}`}>
                      {formatRoleDisplay(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(user.role === 'mover' || user.employeeId) ? (
                      user.hourlyRateCents ? formatCurrency(user.hourlyRateCents) + '/hr' : 'N/A'
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.isActive !== false ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPasswordClick(user)}
                        className="text-yellow-600 hover:text-yellow-900 text-xs"
                        title="Reset Password"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={currentUser?.id === user.id || deleteMutation.isPending}
                        className={`text-xs ${
                          currentUser?.id === user.id
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        title={currentUser?.id === user.id ? 'Cannot delete your own account' : 'Delete User'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No users found. Add your first user above.
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
            {(() => {
              const user = users?.find(u => u.id === resetPasswordUserId)
              if (!user) return null
              return (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Reset password for <strong>{user.email}</strong>
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Minimum 6 characters"
                      minLength={6}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetPassword}
                      disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button
                      onClick={() => {
                        setShowResetPasswordModal(false)
                        setResetPasswordUserId(null)
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
