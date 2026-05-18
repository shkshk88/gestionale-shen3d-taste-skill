import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/Login'))

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const CaseList = lazy(() => import('@/pages/admin/Cases/CaseList'))
const CaseDetail = lazy(() => import('@/pages/admin/Cases/CaseDetail'))
const CaseForm = lazy(() => import('@/pages/admin/Cases/CaseForm'))
const ClientList = lazy(() => import('@/pages/admin/Clients/ClientList'))
const ClientDetail = lazy(() => import('@/pages/admin/Clients/ClientDetail'))
const ClientForm = lazy(() => import('@/pages/admin/Clients/ClientForm'))
const PriceListPage = lazy(() => import('@/pages/admin/PriceLists/PriceListPage'))
const ReportsPage = lazy(() => import('@/pages/admin/Reports/ReportsPage'))
const InvoiceList = lazy(() => import('@/pages/admin/Invoices/InvoiceList'))
const NotificationsPage = lazy(() => import('@/pages/admin/Notifications/NotificationsPage'))
const Viewer3DPage = lazy(() => import('@/pages/admin/Viewer3D/Viewer3DPage'))
const CalendarPage = lazy(() => import('@/pages/admin/Calendar'))
const SettingsPage = lazy(() => import('@/pages/admin/Settings'))

// Client (Dentist) pages
const ClientDashboard = lazy(() => import('@/pages/client/Dashboard'))
const NewCase = lazy(() => import('@/pages/client/NewCase'))
const MyCases = lazy(() => import('@/pages/client/MyCases'))
const ClientCaseDetail = lazy(() => import('@/pages/client/CaseDetail'))
const ClientProfile = lazy(() => import('@/pages/client/Profile'))
const CaseConfirmation = lazy(() => import('@/pages/client/CaseConfirmation'))
const ClientChat = lazy(() => import('@/pages/client/Chat'))

function App() {
  const { i18n } = useTranslation()
  const { isAuthenticated, user } = useAuthStore()

  // Set document direction for RTL languages (Hebrew)
  const dir = i18n.language === 'he' ? 'rtl' : 'ltr'

  // Sync <html dir/lang> with i18n (m-02 audit: era solo sul div root)
  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = i18n.language
  }, [dir, i18n.language])

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AuthGuard allowedRoles={['admin', 'operator']}>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="cases" element={<CaseList />} />
            <Route path="cases/new" element={<CaseForm />} />
            <Route path="cases/:id" element={<CaseDetail />} />
            <Route path="cases/:id/edit" element={<CaseForm />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="clients/new" element={<ClientForm />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="clients/:id/edit" element={<ClientForm />} />
            <Route path="price-lists" element={<PriceListPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="viewer-3d" element={<Viewer3DPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Client (Dentist) routes */}
          <Route
            path="/portal"
            element={
              <AuthGuard allowedRoles={['client']}>
                <ClientLayout />
              </AuthGuard>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="new-case" element={<NewCase />} />
            <Route path="case-confirmation" element={<CaseConfirmation />} />
            <Route path="cases" element={<MyCases />} />
            <Route path="cases/:id" element={<ClientCaseDetail />} />
            <Route path="chat" element={<ClientChat />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Default redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                user?.role === 'client' ? (
                  <Navigate to="/portal" replace />
                ) : (
                  <Navigate to="/admin" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  )
}

export default App
