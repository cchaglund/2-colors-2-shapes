import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '16px',
          fontFamily: 'system-ui', color: 'var(--color-text-primary, #333)',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: 'var(--color-text-secondary, #666)' }}>
            Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
              background: 'var(--color-accent, #3B82F6)', color: 'white',
              border: 'none', fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
