import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackMinimal?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, showDetails: false };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallbackMinimal) {
        return (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-destructive text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              <span>This section failed to load</span>
            </div>
            <Button onClick={this.handleReload} variant="ghost" size="sm" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">
            An unexpected error occurred. Please try reloading.
          </p>
          <Button onClick={this.handleReload} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          {this.state.error && (
            <div className="w-full max-w-md">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
              >
                {this.state.showDetails ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {this.state.showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              {this.state.showDetails && (
                <pre className="mt-2 p-3 bg-muted rounded text-xs text-left overflow-auto max-h-40 text-muted-foreground">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
