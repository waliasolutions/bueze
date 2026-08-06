import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { categorizeError } from "./errorCategories";

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

// ---------------------------------------------------------------------------
// Persistent error log (SSOT: every app error goes through captureException)
// ---------------------------------------------------------------------------

/** Keys that must never be persisted, even if a caller passes them by accident. */
const SENSITIVE_KEYS = [
  'password', 'token', 'access_token', 'refresh_token', 'jwt', 'apikey',
  'api_key', 'secret', 'authorization', 'session',
];

const sanitizeContext = (context?: Record<string, any>): Record<string, any> => {
  if (!context) return {};
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) continue;
    if (value === undefined || typeof value === 'function') continue;
    clean[key] = value instanceof Error ? value.message : value;
  }
  return clean;
};

/**
 * Fire-and-forget persistence of an error into public.app_error_log.
 * Never throws and never blocks the caller — logging must not break the app.
 */
const persistError = (error: Error, context?: Record<string, any>) => {
  try {
    const categorized = categorizeError(error);
    const safeContext = sanitizeContext(context);
    const contextName = typeof safeContext.context === 'string' ? safeContext.context : 'unknown';
    delete safeContext.context;

    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      return supabase.from('app_error_log').insert({
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        context: contextName,
        category: categorized.category,
        severity: categorized.severity,
        message: categorized.message,
        detail: error?.message ?? null,
        route: typeof window !== 'undefined' ? window.location.pathname : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        correlation_id: getCorrelationId(),
        metadata: safeContext,
      });
    }).catch(() => {
      /* logging failures are intentionally silent */
    });
  } catch {
    /* logging failures are intentionally silent */
  }
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

  // Always persist to the in-app error log so admins have a history.
  persistError(error, context);
};
