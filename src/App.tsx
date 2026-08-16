import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/components/auth/AuthContext'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { Automations } from '@/pages/Automations'
import { Admin } from '@/pages/Admin'
import { Budget } from '@/pages/Budget'
import { Accounts } from '@/pages/Accounts'
import { Dashboard } from '@/pages/Dashboard'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { NuevoMovimiento, EditarMovimiento } from '@/pages/NewMovements'
import { Profile } from '@/pages/Profile'
import { RecoverPassword } from '@/pages/RecoverPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { Reports } from '@/pages/Reports'
import { SignUp } from '@/pages/SignUp'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<RecoverPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/budget"
            element={
              <RequireAuth>
                <Budget />
              </RequireAuth>
            }
          />
          <Route
            path="/movimientos/nuevo"
            element={
              <RequireAuth>
                <NuevoMovimiento />
              </RequireAuth>
            }
          />
          <Route
            path="/movimientos/editar/:id"
            element={
              <RequireAuth>
                <EditarMovimiento />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/accounts"
            element={
              <RequireAuth>
                <AppShell>
                  <Accounts />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <AppShell>
                  <Reports />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/automations"
            element={
              <RequireAuth>
                <AppShell>
                  <Automations />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AppShell>
                  <Admin />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            style: {
              fontFamily: 'inherit',
              borderRadius: '0.75rem',
              borderColor: 'hsl(var(--border))',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
