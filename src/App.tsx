import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import { DriveProvider } from './context/DriveContext';

// Layout & Guardian Wrappers
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Page Views
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { Courses } from './pages/Courses';
import { Achievements } from './pages/Achievements';
import { Settings } from './pages/Settings';
import { AdminUsers } from './pages/AdminUsers';
import { Backups } from './pages/Backups';
import { NotFound } from './pages/NotFound';

// Setup TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000 // 5 minutes cache
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <DriveProvider>
              <Router>
                <Routes>
                  {/* Public route */}
                  <Route path="/login" element={<Login />} />

                  {/* Private Dashboard layouts */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    {/* General admin access routes */}
                    <Route index element={<Dashboard />} />
                    <Route path="students" element={<Students />} />
                    <Route path="teachers" element={<Teachers />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="achievements" element={<Achievements />} />

                    {/* Super Admin restricted routes */}
                    <Route 
                      path="settings" 
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="admins" 
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <AdminUsers />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="backups" 
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <Backups />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Fallback route inside layout */}
                    <Route path="404" element={<NotFound />} />
                  </Route>

                  {/* Global Fallback Route */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Router>
            </DriveProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
