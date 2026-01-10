import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, log to monitoring or local audit logs
    console.error('Unhandled error:', error, info);
    import('@/services/auditService').then(({ auditService }) => {
      auditService.logError('app', { message: error.message, stack: (error as any).stack, info });
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please reload the app. If the issue persists, contact support.</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
