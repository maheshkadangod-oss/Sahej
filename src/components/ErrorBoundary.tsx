import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
          <p className="text-3xl mb-4">💛</p>
          <h2 className="text-lg font-serif font-medium text-brand-ink mb-2">Something went wrong</h2>
          <p className="text-sm text-brand-sage mb-6">Don't worry — your data is safe.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-3 bg-brand-clay text-white rounded-2xl text-sm font-medium press-effect min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
