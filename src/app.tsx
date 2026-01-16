import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/public/landingPage'
import LoginPage from './pages/public/loginPage'
import EstimatePage from './pages/public/estimatePage'
import CheckoutPage from './pages/public/checkoutPage'
import BookingSuccessPage from './pages/public/bookingSuccessPage'
import QuotePage from './pages/public/quotePage'
import CustomerLayout from './pages/customer/customerLayout'
import AvailabilityPage from './pages/customer/availabilityPage'
import CreateBookingPage from './pages/customer/createBookingPage'
import MyBookingsPage from './pages/customer/myBookingsPage'
import ReschedulePage from './pages/customer/reschedulePage'
import MessagesPage from './pages/customer/messagesPage'
import SalesLayout from './pages/sales/salesLayout'
import SalesCreateBookingPage from './pages/sales/salesCreateBookingPage'
import SalesBookingsPage from './pages/sales/salesBookingsPage'
import SalesJobsPage from './pages/sales/salesJobsPage'
import MoverLayout from './pages/mover/moverLayout'
import DispatchBoardPage from './pages/mover/dispatchBoardPage'
import JobDetailPage from './pages/mover/jobDetailPage'
import JobTipPage from './pages/mover/jobTipPage'
import JobInvoicePage from './pages/mover/jobInvoicePage'
import PaymentSuccessPage from './pages/mover/paymentSuccessPage'
import CheckInOutPage from './pages/mover/checkInOutPage'
import CommunicationsPage from './pages/mover/communicationsPage'
import DayOffRequestPage from './pages/mover/dayOffRequestPage'
import AdminLayout from './pages/admin/adminLayout'
import UserManagementPage from './pages/admin/userManagementPage'
import ConfigPage from './pages/admin/configPage'
import EmployeesAdminPage from './pages/admin/employeesAdminPage'
import JobsAdminPage from './pages/admin/jobsAdminPage'
import BookingsAdminPage from './pages/admin/bookingsAdminPage'
import AuditLogPage from './pages/admin/auditLogPage'
import AdminCreateBookingPage from './pages/admin/adminCreateBookingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/estimate" element={<EstimatePage />} />
      <Route path="/booking-success" element={<BookingSuccessPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/quote" element={<QuotePage />} />
      <Route path="/create-booking" element={<CreateBookingPage />} />
      
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<Navigate to="/customer/availability" replace />} />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route path="create-booking" element={<CreateBookingPage />} />
        <Route path="my-bookings" element={<MyBookingsPage />} />
        <Route path="reschedule" element={<ReschedulePage />} />
        <Route path="messages" element={<MessagesPage />} />
      </Route>
      
      <Route path="/sales" element={<SalesLayout />}>
        <Route index element={<Navigate to="/sales/bookings" replace />} />
        <Route path="bookings" element={<SalesBookingsPage />} />
        <Route path="jobs" element={<SalesJobsPage />} />
        <Route path="job/:id" element={<JobDetailPage />} />
        <Route path="job/:id/tip" element={<JobTipPage />} />
        <Route path="job/:id/invoice" element={<JobInvoicePage />} />
        <Route path="job/:id/payment-success" element={<PaymentSuccessPage />} />
        <Route path="create-booking" element={<SalesCreateBookingPage />} />
      </Route>
      
      <Route path="/mover" element={<MoverLayout />}>
        <Route index element={<Navigate to="/mover/dispatch" replace />} />
        <Route path="dispatch" element={<DispatchBoardPage />} />
        <Route path="job/:id" element={<JobDetailPage />} />
        <Route path="job/:id/tip" element={<JobTipPage />} />
        <Route path="job/:id/invoice" element={<JobInvoicePage />} />
        <Route path="job/:id/payment-success" element={<PaymentSuccessPage />} />
        <Route path="check-in-out" element={<CheckInOutPage />} />
        <Route path="communications" element={<CommunicationsPage />} />
        <Route path="day-off" element={<DayOffRequestPage />} />
      </Route>
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/users" replace />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="employees" element={<EmployeesAdminPage />} />
        <Route path="bookings" element={<BookingsAdminPage />} />
        <Route path="jobs" element={<JobsAdminPage />} />
        <Route path="job/:id" element={<JobDetailPage />} />
        <Route path="job/:id/tip" element={<JobTipPage />} />
        <Route path="job/:id/invoice" element={<JobInvoicePage />} />
        <Route path="job/:id/payment-success" element={<PaymentSuccessPage />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route path="create-booking" element={<AdminCreateBookingPage />} />
      </Route>
    </Routes>
  )
}
