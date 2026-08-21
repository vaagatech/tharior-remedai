import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Tharior Remedai UI:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">UI Component Safeguard</h2>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              An unexpected interface render issue occurred. Tharior Remedai's error boundary caught the exception to prevent UI lockup.
            </p>
            <div className="bg-slate-950 rounded-lg p-3 text-xs font-mono text-rose-300/80 mb-6 overflow-x-auto border border-slate-800">
              {this.state.error?.message || 'Unknown render exception'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
