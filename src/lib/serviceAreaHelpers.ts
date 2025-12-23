/**
 * Service Area Helpers - SSOT for parsing and building service areas
 * Used by both HandwerkerOnboarding and HandwerkerProfileEdit
 */
import { SWISS_CANTONS } from '@/config/cantons';

export type ServiceRadius = 'city' | 'canton' | 'nationwide' | 'custom';

export interface ServiceAreaConfig {
  radius: ServiceRadius;
  businessPlz: string;
  businessCity: string;
  businessCanton: string;
  customCantons: string[];
}

/**
 * Parse stored service_areas array to determine the radius type and config
 */
export const parseServiceAreas = (areas: string[]): ServiceAreaConfig => {
  const allCantonCodes = SWISS_CANTONS.map(c => c.value);
  
  // Separate cantons from PLZ codes
  const storedCantons = areas.filter(area => 
    area.length === 2 && allCantonCodes.includes(area as typeof allCantonCodes[number])
  );
  const storedPlz = areas.find(area => /^\d{4}$/.test(area));
  
  // Default config
  const config: ServiceAreaConfig = {
    radius: 'canton',
    businessPlz: storedPlz || '',
    businessCity: '',
    businessCanton: '',
    customCantons: [],
  };
  
  // Determine radius type based on stored data
  if (storedCantons.length === allCantonCodes.length) {
    // All 26 cantons = nationwide
    config.radius = 'nationwide';
    if (storedCantons.length > 0) {
      // Try to determine the business canton from the first one
      config.businessCanton = storedCantons[0];
    }
  } else if (storedCantons.length > 1) {
    // Multiple cantons = custom selection
    config.radius = 'custom';
    config.customCantons = storedCantons;
    config.businessCanton = storedCantons[0];
  } else if (storedCantons.length === 1) {
    // Single canton = canton radius
    config.radius = 'canton';
    config.businessCanton = storedCantons[0];
  } else if (storedPlz) {
    // Just PLZ = city radius
    config.radius = 'city';
  }
  
  return config;
};

/**
 * Build service_areas array from radius configuration
 */
export const buildServiceAreas = (
  radius: ServiceRadius,
  options: {
    plz?: string;
    canton?: string;
    customCantons?: string[];
  }
): string[] => {
  const allCantonCodes = SWISS_CANTONS.map(c => c.value);
  
  switch (radius) {
    case 'city':
      // Just the PLZ
      return options.plz ? [options.plz] : [];
      
    case 'canton':
      // The detected canton
      return options.canton ? [options.canton] : [];
      
    case 'nationwide':
      // All cantons
      return allCantonCodes;
      
    case 'custom':
      // Selected cantons
      return options.customCantons || [];
      
    default:
      return [];
  }
};

/**
 * Get a human-readable summary of service areas
 */
export const getServiceAreaSummary = (
  radius: ServiceRadius,
  options: {
    businessCity?: string;
    businessCanton?: string;
    customCantons?: string[];
  }
): string => {
  const cantonLabel = SWISS_CANTONS.find(c => c.value === options.businessCanton)?.label || options.businessCanton;
  
  switch (radius) {
    case 'city':
      return `Nur ${options.businessCity || 'Ihre Stadt'}`;
    case 'canton':
      return `Kanton ${cantonLabel}`;
    case 'nationwide':
      return 'Ganze Schweiz (alle Kantone)';
    case 'custom':
      return `${options.customCantons?.length || 0} Kantone ausgewählt`;
    default:
      return '';
  }
};
