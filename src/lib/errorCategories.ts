export enum ErrorCategory {
  FETCH_TIMEOUT = 'fetch_timeout',
  FETCH_EMPTY = 'fetch_empty',
  AUTH_401 = 'auth_401',
  AUTH_403 = 'auth_403',
  RLS_POLICY = 'rls_policy',
  RACE_CONDITION = 'race_condition',
  DUPLICATE_KEY = 'duplicate_key',
  NETWORK = 'network',
  VALIDATION = 'validation',
  FILE_UPLOAD = 'file_upload',
  FILE_TOO_LARGE = 'file_too_large',
  INVALID_FILE_TYPE = 'invalid_file_type',
  STORAGE_QUOTA = 'storage_quota',
  UNKNOWN = 'unknown'
}

export interface CategorizedError {
  category: ErrorCategory;
  originalError: any;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const categorizeError = (error: any): CategorizedError => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code;
  const status = error?.status;

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      category: ErrorCategory.FETCH_TIMEOUT,
      originalError: error,
      message: 'Zeitüberschreitung bei der Anfrage',
      severity: 'medium'
    };
  }

  // File upload errors
  if (message.includes('file size') || message.includes('zu groß') || message.includes('3mb')) {
    return {
      category: ErrorCategory.FILE_TOO_LARGE,
      originalError: error,
      message: 'Dateigrösse überschreitet das Maximum (3MB)',
      severity: 'low'
    };
  }

  if (message.includes('file type') || message.includes('dateityp') || message.includes('nicht erlaubt')) {
    return {
      category: ErrorCategory.INVALID_FILE_TYPE,
      originalError: error,
      message: 'Ungültiger Dateityp. Nur Bilder erlaubt.',
      severity: 'low'
    };
  }

  if (message.includes('maximum') || message.includes('maximal') || message.includes('2 bilder')) {
    return {
      category: ErrorCategory.FILE_UPLOAD,
      originalError: error,
      message: 'Maximale Anzahl Dateien überschritten (max. 2 Bilder)',
      severity: 'low'
    };
  }

  if (message.includes('storage') || message.includes('quota')) {
    return {
      category: ErrorCategory.STORAGE_QUOTA,
      originalError: error,
      message: 'Speicherkontingent erschöpft',
      severity: 'high'
    };
  }

  // Auth errors
  if (message.includes('jwt') || code === '401' || status === 401 || message.includes('unauthorized')) {
    return {
      category: ErrorCategory.AUTH_401,
      originalError: error,
      message: 'Anmeldung erforderlich',
      severity: 'high'
    };
  }

  if (code === '403' || status === 403 || message.includes('forbidden')) {
    return {
      category: ErrorCategory.AUTH_403,
      originalError: error,
      message: 'Zugriff verweigert',
      severity: 'high'
    };
  }

  // RLS Policy violations
  if (message.includes('row-level security') || message.includes('rls') || message.includes('policy')) {
    return {
      category: ErrorCategory.RLS_POLICY,
      originalError: error,
      message: 'Zugriffsbeschränkung: Unzureichende Berechtigung',
      severity: 'high'
    };
  }

  // Race conditions
  if (message.includes('race') || message.includes('concurrent')) {
    return {
      category: ErrorCategory.RACE_CONDITION,
      originalError: error,
      message: 'Gleichzeitige Bearbeitung erkannt',
      severity: 'medium'
    };
  }

  // Duplicate key errors
  if (message.includes('duplicate') || message.includes('unique') || code === '23505') {
    return {
      category: ErrorCategory.DUPLICATE_KEY,
      originalError: error,
      message: 'Doppelter Eintrag erkannt',
      severity: 'low'
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      category: ErrorCategory.NETWORK,
      originalError: error,
      message: 'Netzwerkverbindungsfehler',
      severity: 'medium'
    };
  }

  // Empty responses
  if (message.includes('empty') || message.includes('no data')) {
    return {
      category: ErrorCategory.FETCH_EMPTY,
      originalError: error,
      message: 'Keine Daten zurückgegeben',
      severity: 'low'
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      category: ErrorCategory.VALIDATION,
      originalError: error,
      message: 'Validierungsfehler',
      severity: 'low'
    };
  }

  // Default unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    originalError: error,
    message: error?.message || 'Ein unbekannter Fehler ist aufgetreten',
    severity: 'medium'
  };
};

// Track error frequency
const errorFrequency = new Map<ErrorCategory, number>();

export const trackError = (error: any): CategorizedError => {
  const categorized = categorizeError(error);
  
  // Increment frequency counter
  const currentCount = errorFrequency.get(categorized.category) || 0;
  errorFrequency.set(categorized.category, currentCount + 1);
  
  return categorized;
};

export const getErrorStats = () => {
  const stats = Array.from(errorFrequency.entries()).map(([category, count]) => ({
    category,
    count,
    percentage: 0
  }));
  
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  
  return stats
    .map(stat => ({
      ...stat,
      percentage: total > 0 ? Math.round((stat.count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
};

// ---------------------------------------------------------------------------
// User-facing German (de-CH) explanations — SSOT for load/save/upload errors.
// Every surface must use these instead of inventing its own wording.
// ---------------------------------------------------------------------------

export interface ExplainedError {
  /** Short headline of what happened. */
  title: string;
  /** Plain explanation of the cause. */
  cause: string;
  /** What the user should do next. */
  action: string;
  /** Raw technical detail (Postgrest/Storage message) for transparency. */
  detail: string;
  /** True when a fresh login is the only way forward. */
  requiresLogin: boolean;
}

const rawDetail = (error: any): string =>
  error?.message || error?.error_description || error?.details || error?.hint || '';

/** Explain why the Handwerker profile could not be loaded or saved. */
export const explainProfileError = (error: any): ExplainedError => {
  const { category } = categorizeError(error);
  const detail = rawDetail(error);

  switch (category) {
    case ErrorCategory.AUTH_401:
      return {
        title: 'Sitzung abgelaufen',
        cause: 'Ihre Anmeldung ist nicht mehr gültig – das passiert, wenn die Seite lange im Hintergrund war.',
        action: 'Bitte melden Sie sich erneut an. Ihre bereits gespeicherten Daten bleiben erhalten.',
        detail,
        requiresLogin: true,
      };
    case ErrorCategory.AUTH_403:
    case ErrorCategory.RLS_POLICY:
      return {
        title: 'Kein Zugriff auf dieses Profil',
        cause: 'Dieses Konto hat keine Berechtigung für das Handwerker-Profil.',
        action: 'Melden Sie sich mit Ihrem Handwerker-Konto an oder kontaktieren Sie uns unter info@bueeze.ch.',
        detail,
        requiresLogin: true,
      };
    case ErrorCategory.NETWORK:
    case ErrorCategory.FETCH_TIMEOUT:
      return {
        title: 'Keine Verbindung zum Server',
        cause: 'Die Daten konnten nicht geladen werden, weil die Internetverbindung unterbrochen war oder zu langsam ist.',
        action: 'Verbindung prüfen (WLAN/Mobilfunk) und «Erneut laden» drücken.',
        detail,
        requiresLogin: false,
      };
    case ErrorCategory.FETCH_EMPTY:
      return {
        title: 'Kein Handwerker-Profil gefunden',
        cause: 'Für dieses Login existiert kein freigegebenes Handwerker-Profil.',
        action: 'Registrierung abschliessen oder uns unter info@bueeze.ch kontaktieren.',
        detail,
        requiresLogin: false,
      };
    default:
      return {
        title: 'Profil konnte nicht geladen werden',
        cause: 'Beim Laden Ihrer Profildaten ist ein unerwarteter Fehler aufgetreten.',
        action: 'Bitte «Erneut laden» drücken. Bleibt der Fehler, senden Sie uns die technische Meldung unten.',
        detail,
        requiresLogin: false,
      };
  }
};

/** Explain why an image upload failed, in plain de-CH. */
export const explainUploadError = (error: any): ExplainedError => {
  const { category } = categorizeError(error);
  const detail = rawDetail(error);

  switch (category) {
    case ErrorCategory.INVALID_FILE_TYPE:
      return {
        title: 'Dateityp nicht unterstützt',
        cause: 'Es können nur Bilddateien hochgeladen werden (JPG, PNG oder WebP).',
        action: 'Bild z. B. als JPG oder PNG speichern und erneut hochladen. PDF-Dateien gehören zu «Dokumente».',
        detail,
        requiresLogin: false,
      };
    case ErrorCategory.FILE_TOO_LARGE:
      return {
        title: 'Bild ist zu gross',
        cause: 'Das Bild ist auch nach der automatischen Verkleinerung grösser als 5 MB.',
        action: 'Bitte ein kleineres Bild wählen oder auf dem Handy als «kleine» Grösse exportieren.',
        detail,
        requiresLogin: false,
      };
    case ErrorCategory.NETWORK:
    case ErrorCategory.FETCH_TIMEOUT:
      return {
        title: 'Upload unterbrochen',
        cause: 'Die Verbindung ist während des Hochladens abgebrochen.',
        action: 'Verbindung prüfen und den Upload erneut starten – die bisherigen Eingaben bleiben erhalten.',
        detail,
        requiresLogin: false,
      };
    case ErrorCategory.AUTH_401:
      return {
        title: 'Sitzung abgelaufen',
        cause: 'Während des Uploads ist Ihre Anmeldung abgelaufen.',
        action: 'Bitte neu anmelden und das Bild danach erneut hochladen.',
        detail,
        requiresLogin: true,
      };
    case ErrorCategory.AUTH_403:
    case ErrorCategory.RLS_POLICY:
      return {
        title: 'Upload nicht erlaubt',
        cause: 'Der Speicher hat den Upload für dieses Konto abgelehnt.',
        action: 'Bitte melden Sie sich neu an. Bleibt es dabei, kontaktieren Sie uns unter info@bueeze.ch.',
        detail,
        requiresLogin: false,
      };
    default:
      return {
        title: 'Bild konnte nicht hochgeladen werden',
        cause: 'Beim Hochladen ist ein unerwarteter Fehler aufgetreten.',
        action: 'Bitte erneut versuchen. Bleibt der Fehler, senden Sie uns die technische Meldung unten.',
        detail,
        requiresLogin: false,
      };
  }
};
