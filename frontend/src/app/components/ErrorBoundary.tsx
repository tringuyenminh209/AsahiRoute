import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--surface-page)' }}>
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-[var(--border-default)] max-w-sm w-full">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              エラーが発生しました
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              予期しないエラーが発生しました。ページを再読み込みしてください。
            </p>
            {this.state.error && (
              <p className="text-xs mb-4 p-2 bg-gray-50 rounded text-left font-mono text-gray-500 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
