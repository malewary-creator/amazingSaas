import { ThemeProvider, BackupProvider } from '@/context';
import { Toaster } from '@/components/ui/Toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { lazy, Suspense } from 'react';

// Lazy load routes to ensure hooks are called inside provider context
const AppRoutes = lazy(() => import('./AppRoutes').then((m) => ({ default: m.AppRoutes })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="spinner"></div>
  </div>
);

function App() {
  return (
    <>
      <ThemeProvider>
        <BackupProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AppRoutes />
            </Suspense>
            <Toaster />
            <PWAInstallPrompt />
          </ErrorBoundary>
        </BackupProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
