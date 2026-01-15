import { Outlet, Link, useNavigate } from 'react-router-dom'
import { logout } from '../../api/authApi'

export default function MoverLayout() {
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
            <div className="flex gap-4">
              <Link to="/mover/dispatch" className="text-gray-700 hover:text-gray-900">
                Dispatch Board
              </Link>
              <Link to="/mover/payroll" className="text-gray-700 hover:text-gray-900">
                Payroll
              </Link>
              <Link to="/mover/communications" className="text-gray-700 hover:text-gray-900">
                Communications
              </Link>
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
