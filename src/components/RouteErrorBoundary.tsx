import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw, LogIn, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'auth' | 'network' | 'chunk' | 'runtime';
  retryCount: number;
}

// Error type detection helpers
const isAuthError = (error: Error): boolean => {
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('not authenticated') ||
    message.includes('session expired') ||
    message.includes('jwt expired') ||
    message.includes('invalid token')
  );
};

const isChunkLoadError = (error: Error): boolean => {
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading css chunk') ||
    error.name === 'ChunkLoadError'
  );
};

const isNetworkError = (error: Error): boolean => {
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('net::') ||
    message.includes('timeout') ||
    error.name === 'NetworkError'
  );
};

class RouteErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  public state: State = {
    hasError: false,
    error: null,
    errorType: 'runtime',
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    let errorType: State['errorType'] = 'runtime';
    
    if (isAuthError(error)) {
      errorType = 'auth';
    } else if (isChunkLoadError(error)) {
      errorType = 'chunk';
    } else if (isNetworkError(error)) {
      errorType = 'network';
    }
    
    return { hasError: true, error, errorType };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
    
    // Auto-retry for chunk load errors (lazy loading failures)
    if (isChunkLoadError(error) && this.state.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.setState(prev => ({ 
          hasError: false, 
          error: null, 
          retryCount: prev.retryCount + 1 
        }));
      }, 1000);
      return;
    }
    
    // Only report non-auth errors to Sentry
    if (!isAuthError(error)) {
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
          route: window.location.pathname,
          errorType: this.state.errorType,
        },
      });
    }
  }

  private handleRetry = () => {
    // For chunk errors, try a hard reload to get fresh chunks
    if (this.state.errorType === 'chunk') {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, retryCount: 0 });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleLogin = () => {
    window.location.href = '/auth';
  };

  public render() {
    if (this.state.hasError) {
      const { errorType } = this.state;
      
      // Auth error - redirect to login
      if (errorType === 'auth') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <LogIn className="h-8 w-8 text-primary" />
                </div>
                
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Sitzung abgelaufen
                </h1>
                
                <p className="text-muted-foreground mb-6">
                  Bitte melden Sie sich erneut an, um fortzufahren.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={this.handleLogin} className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Zur Anmeldung
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                    <Home className="h-4 w-4" />
                    Startseite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }
      
      // Network/Chunk error - connection issue
      if (errorType === 'network' || errorType === 'chunk') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-muted">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                  <WifiOff className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Verbindungsproblem
                </h1>
                
                <p className="text-muted-foreground mb-6">
                  Die Seite konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={this.handleRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Erneut versuchen
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                    <Home className="h-4 w-4" />
                    Startseite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }
      
      // Runtime error - generic error page
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/30">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Seite konnte nicht geladen werden
              </h1>
              
              <p className="text-muted-foreground mb-6">
                Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-muted rounded-lg text-left">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={this.handleRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Erneut versuchen
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Zur Startseite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
