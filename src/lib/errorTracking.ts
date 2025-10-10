import * as Sentry from "@sentry/react";

export const initErrorTracking = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration()
      ],
      beforeSend(event, hint) {
        // Add correlation ID to error context
        if (event.contexts) {
          event.contexts.correlation = {
            session_id: sessionStorage.getItem('correlation_id') || 'unknown'
          };
        }
        return event;
      }
    });
  }
};

// Generate correlation ID on app start
export const generateCorrelationId = () => {
  const correlationId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('correlation_id', correlationId);
  return correlationId;
};

// Get current correlation ID
export const getCorrelationId = () => {
  return sessionStorage.getItem('correlation_id') || 'unknown';
};

// Log with correlation ID
export const logWithCorrelation = (message: string, data?: any) => {
  const correlationId = getCorrelationId();
  console.log(`[${correlationId}] ${message}`, data || '');
};

// Capture exception with Sentry
export const captureException = (error: Error, context?: Record<string, any>) => {
  const correlationId = getCorrelationId();
  
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: {
        ...context,
        correlation_id: correlationId
      }
    });
  } else {
    console.error(`[${correlationId}] Error:`, error, context);
  }
};
