import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom'
import { logout } from '../../api/authApi'

export default function CustomerLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/#/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex gap-4">
              <NavLink to="/customer/availability" className={({ isActive }) => isActive ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-gray-900'}>
                Availability
              </NavLink>
              <NavLink to="/customer/my-bookings" className={({ isActive }) => isActive ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-gray-900'}>
                My Bookings
              </NavLink>
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
