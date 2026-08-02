import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import StorefrontLayout from './components/layout/StorefrontLayout'
import DashboardLayout from './components/layout/DashboardLayout'

import AuthLayout from './pages/auth/AuthLayout'
import AuthPage from './pages/auth/AuthPage'

import ProductCatalog from './pages/customer/ProductCatalog'
import ProductDetail from './pages/customer/ProductDetail'
import PackagesList from './pages/customer/PackagesList'
import PackageDetail from './pages/customer/PackageDetail'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import ReservationForm from './pages/customer/ReservationForm'
import MyOrders from './pages/customer/MyOrders'
import OrderDetail from './pages/customer/OrderDetail'
import MyReservations from './pages/customer/MyReservations'
import ReservationDetail from './pages/customer/ReservationDetail'
import Schedule from './pages/customer/schedule'

import AdminDashboard from './pages/admin/AdminDashboard'
import ProductsAdmin from './pages/admin/ProductsAdmin'
import CategoriesAdmin from './pages/admin/CategoriesAdmin'
import PackagesAdmin from './pages/admin/PackagesAdmin'
import InventoryAdmin from './pages/admin/InventoryAdmin'
import OrdersAdmin from './pages/admin/OrdersAdmin'
import ReservationsAdmin from './pages/admin/ReservationsAdmin'
import StaffAdmin from './pages/admin/StaffAdmin'
import ReportsAdmin from './pages/admin/ReportsAdmin'

import StaffTasks from './pages/staff/StaffTasks'
import StaffInventory from './pages/staff/StaffInventory'

import CateringManagerDashboard from './pages/catering-manager/CateringManagerDashboard'
import EventBookingsManager from './pages/catering-manager/EventBookingsManager'
import TasksManager from './pages/catering-manager/TasksManager'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="register" />} />
            </Route>

            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<ProductCatalog />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/packages" element={<PackagesList />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/packages/:id" element={<PackageDetail />} />

              <Route
                path="/cart"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reserve/:packageId"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <ReservationForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-orders/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-reservations"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <MyReservations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-reservations/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <ReservationDetail />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['administrator']}>
                  <DashboardLayout role="administrator" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="packages" element={<PackagesAdmin />} />
              <Route path="inventory" element={<InventoryAdmin />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="reservations" element={<ReservationsAdmin />} />
              <Route path="staff" element={<StaffAdmin />} />
              <Route path="reports" element={<ReportsAdmin />} />
            </Route>

            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <DashboardLayout role="staff" />
                </ProtectedRoute>
              }
            >
              <Route index element={<StaffTasks />} />
              <Route path="inventory" element={<StaffInventory />} />
            </Route>

            <Route
              path="/catering-manager"
              element={
                <ProtectedRoute allowedRoles={['catering_manager']}>
                  <DashboardLayout role="catering_manager" />
                </ProtectedRoute>
              }
            >
              <Route index element={<CateringManagerDashboard />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="packages" element={<PackagesAdmin />} />
              <Route path="reservations" element={<ReservationsAdmin />} />
              <Route path="event-bookings" element={<EventBookingsManager />} />
              <Route path="tasks" element={<TasksManager />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
