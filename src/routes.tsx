// Routes configuration - can be used for route definitions
export const routes = {
  home: '/',
  login: '/login',
  customer: {
    availability: '/customer/availability',
    createBooking: '/customer/create-booking',
    myBookings: '/customer/my-bookings',
    reschedule: '/customer/reschedule',
    messages: '/customer/messages',
  },
  sales: {
    createBooking: '/sales/create-booking',
    bookings: '/sales/bookings',
    commission: '/sales/commission',
  },
  mover: {
    dispatch: '/mover/dispatch',
    jobDetail: '/mover/job/:id',
    checkInOut: '/mover/check-in-out',
    payroll: '/mover/payroll',
    communications: '/mover/communications',
  },
  admin: {
    users: '/admin/users',
    config: '/admin/config',
    employees: '/admin/employees',
    createBooking: '/admin/create-booking',
    audit: '/admin/audit',
  },
}
