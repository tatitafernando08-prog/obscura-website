import { Component, type ErrorInfo, type ReactNode } from 'react';

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
    console.error('Unhandled error in Obscura app:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Something went wrong.</h1>
          <p>Please refresh the page. If this keeps happening, let us know at obscurabytechlume@gmail.com.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
