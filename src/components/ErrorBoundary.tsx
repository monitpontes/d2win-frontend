import * as React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: unknown) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Não foi possível carregar o mapa.</p>
            <p className="mt-1 text-sm text-muted-foreground">Recarregue a página ou tente novamente.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
