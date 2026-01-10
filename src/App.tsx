import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, BackupProvider } from '@/context';
import { Toaster } from '@/components/ui/Toaster';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/modules/auth/LoginPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

// Module imports (lazy loading for better performance)
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/modules/dashboard/Dashboard'));
const LeadsModule = lazy(() => import('@/modules/leads/LeadsModule'));
const CustomersModule = lazy(() => import('@/modules/customers/CustomersModule'));
const SurveyModule = lazy(() => import('@/modules/survey/SurveyModule'));
const ProjectsModule = lazy(() => import('@/modules/projects/ProjectsModule'));
const QuotationsModule = lazy(() => import('@/modules/quotations/QuotationsModule'));
const InvoicesModule = lazy(() => import('@/modules/invoices/InvoicesModule'));
const PaymentsModule = lazy(() => import('@/modules/payments/PaymentsModule'));
const InventoryModule = lazy(() => import('@/modules/inventory/InventoryModule'));
const ServiceModule = lazy(() => import('@/modules/service/ServiceModule'));
const ReportsModule = lazy(() => import('@/modules/reports/ReportsModule'));
const SettingsModule = lazy(() => import('@/modules/settings/SettingsModule'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="spinner"></div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <>
      <ThemeProvider>
        <BackupProvider>
          <ErrorBoundary>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            
            {/* Redirect root to appropriate page */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
            
            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/leads/*" element={<LeadsModule />} />
                      <Route path="/customers/*" element={<CustomersModule />} />
                      <Route path="/survey/*" element={<SurveyModule />} />
                      <Route path="/projects/*" element={<ProjectsModule />} />
                      <Route path="/quotations/*" element={<QuotationsModule />} />
                      <Route path="/invoices/*" element={<InvoicesModule />} />
                      <Route path="/payments/*" element={<PaymentsModule />} />
                      <Route path="/inventory/*" element={<InventoryModule />} />
                      <Route path="/service/*" element={<ServiceModule />} />
                      <Route path="/reports/*" element={<ReportsModule />} />
                      <Route path="/settings/*" element={<SettingsModule />} />
                      
                      {/* 404 - redirect to dashboard */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
                  </Routes>
              </Suspense>
            </Router>
          </ErrorBoundary>
        </BackupProvider>
      </ThemeProvider>
      
      {/* Global toast notifications */}
      <Toaster />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
}

export default App;
