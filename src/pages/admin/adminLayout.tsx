import { Outlet, Link, useNavigate } from 'react-router-dom'
import { logout } from '../../api/authApi'

export default function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <span className="font-bold text-xl text-blue-800">Admin Portal</span>
              <div className="flex gap-4">
                <Link to="/admin/users" className="text-gray-700 hover:text-gray-900">
                  Users
                </Link>
                <Link to="/admin/config" className="text-gray-700 hover:text-gray-900">
                  Config
                </Link>
                <Link to="/admin/employees" className="text-gray-700 hover:text-gray-900">
                  Employees
                </Link>
                <Link to="/admin/bookings" className="text-gray-700 hover:text-gray-900">
                  Bookings
                </Link>
                <Link to="/admin/jobs" className="text-gray-700 hover:text-gray-900">
                  Jobs
                </Link>
                <Link to="/admin/create-booking" className="text-gray-700 hover:text-gray-900">
                  Create Booking
                </Link>
                <Link to="/admin/audit" className="text-gray-700 hover:text-gray-900">
                  Audit Log
                </Link>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-700 hover:text-gray-900">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
