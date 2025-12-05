/**
 * localStorage Versioning Utilities
 * Ensures proper migration and cache invalidation for stored data
 */

interface VersionedData<T> {
  version: number;
  timestamp: number;
  data: T;
}

interface MigrationConfig<T> {
  key: string;
  currentVersion: number;
  migrations?: Record<number, (data: unknown) => unknown>;
  ttlHours?: number; // Time to live in hours
}

/**
 * Save data with version tracking
 */
export function saveVersionedData<T>(
  key: string,
  data: T,
  version: number
): void {
  const versionedData: VersionedData<T> = {
    version,
    timestamp: Date.now(),
    data,
  };
  localStorage.setItem(key, JSON.stringify(versionedData));
}

/**
 * Load versioned data with migration support
 */
export function loadVersionedData<T>(
  config: MigrationConfig<T>
): { data: T | null; wasRecovered: boolean; lastSaved: Date | null } {
  const { key, currentVersion, migrations = {}, ttlHours = 168 } = config; // Default 7 days TTL
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { data: null, wasRecovered: false, lastSaved: null };
    }

    const parsed = JSON.parse(stored);
    
    // Check if it's versioned data
    if (parsed.version === undefined) {
      // Legacy data without versioning - treat as version 0
      const hoursSinceLastSave = parsed.timestamp 
        ? (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        : ttlHours + 1; // If no timestamp, consider it expired
      
      if (hoursSinceLastSave > ttlHours) {
        localStorage.removeItem(key);
        return { data: null, wasRecovered: false, lastSaved: null };
      }

      // Migrate legacy data through all versions
      let migratedData = parsed;
      for (let v = 0; v < currentVersion; v++) {
        if (migrations[v + 1]) {
          migratedData = migrations[v + 1](migratedData);
        }
      }
      
      // Save migrated data with current version
      saveVersionedData(key, migratedData, currentVersion);
      
      return { 
        data: migratedData as T, 
        wasRecovered: true, 
        lastSaved: parsed.timestamp ? new Date(parsed.timestamp) : null 
      };
    }

    // Check TTL
    const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
    if (hoursSinceLastSave > ttlHours) {
      localStorage.removeItem(key);
      return { data: null, wasRecovered: false, lastSaved: null };
    }

    // Run migrations if needed
    if (parsed.version < currentVersion) {
      let migratedData = parsed.data;
      for (let v = parsed.version; v < currentVersion; v++) {
        if (migrations[v + 1]) {
          migratedData = migrations[v + 1](migratedData);
        }
      }
      
      // Save migrated data
      saveVersionedData(key, migratedData, currentVersion);
      
      return { 
        data: migratedData as T, 
        wasRecovered: true, 
        lastSaved: new Date(parsed.timestamp) 
      };
    }

    return { 
      data: parsed.data as T, 
      wasRecovered: true, 
      lastSaved: new Date(parsed.timestamp) 
    };
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    localStorage.removeItem(key);
    return { data: null, wasRecovered: false, lastSaved: null };
  }
}

/**
 * Clear versioned data
 */
export function clearVersionedData(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Check if data exists and is valid
 */
export function hasValidData(key: string, ttlHours: number = 168): boolean {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return false;

    const parsed = JSON.parse(stored);
    const timestamp = parsed.timestamp || 0;
    const hoursSinceLastSave = (Date.now() - timestamp) / (1000 * 60 * 60);
    
    return hoursSinceLastSave <= ttlHours;
  } catch {
    return false;
  }
}

// Storage keys constants - Single Source of Truth
export const STORAGE_KEYS = {
  HANDWERKER_ONBOARDING_DRAFT: 'handwerker-onboarding-draft',
  COOKIE_CONSENT: 'bueeze_cookie_consent',
  SUBMIT_LEAD_DRAFT: 'submit-lead-draft',
} as const;

// Version constants for each storage key
export const STORAGE_VERSIONS = {
  HANDWERKER_ONBOARDING_DRAFT: 2,
  COOKIE_CONSENT: 1,
  SUBMIT_LEAD_DRAFT: 1,
} as const;
