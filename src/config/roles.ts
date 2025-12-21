// Centralized role configuration - SSOT for role management
// All role-related constants and helpers should be defined here

import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export interface RoleConfig {
  label: string;
  labelShort: string;
  description: string;
  priority: number;
  color: 'default' | 'secondary' | 'outline' | 'destructive';
}

/**
 * Role configuration with labels, descriptions, and display properties
 * Priority: Lower number = higher priority (used for determining primary role)
 */
export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  super_admin: {
    label: 'Super Administrator',
    labelShort: 'Super Admin',
    description: 'Vollzugriff auf alle System- und Benutzerverwaltungsfunktionen',
    priority: 1,
    color: 'default',
  },
  admin: {
    label: 'Administrator',
    labelShort: 'Admin',
    description: 'Erweiterte Rechte für Plattformverwaltung',
    priority: 2,
    color: 'secondary',
  },
  department_admin: {
    label: 'Abteilungsadministrator',
    labelShort: 'Abt. Admin',
    description: 'Verwaltung einer bestimmten Abteilung',
    priority: 3,
    color: 'secondary',
  },
  handwerker: {
    label: 'Handwerker',
    labelShort: 'Handwerker',
    description: 'Handwerker - antwortet auf Aufträge und erstellt Offerten',
    priority: 4,
    color: 'outline',
  },
  client: {
    label: 'Kunde',
    labelShort: 'Kunde',
    description: 'Kunde/Auftraggeber - erstellt Aufträge',
    priority: 5,
    color: 'outline',
  },
  user: {
    label: 'Benutzer (Legacy)',
    labelShort: 'Benutzer',
    description: 'Standard-Benutzerrolle (Legacy)',
    priority: 6,
    color: 'outline',
  },
};

/**
 * Get role label for display
 */
export function getRoleLabel(role: AppRole | string): string {
  return ROLE_CONFIG[role as AppRole]?.label || role;
}

/**
 * Get short role label for badges
 */
export function getRoleLabelShort(role: AppRole | string): string {
  return ROLE_CONFIG[role as AppRole]?.labelShort || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: AppRole | string): string {
  return ROLE_CONFIG[role as AppRole]?.description || '';
}

/**
 * Get role badge color variant
 */
export function getRoleBadgeVariant(role: AppRole | string): 'default' | 'secondary' | 'outline' | 'destructive' {
  return ROLE_CONFIG[role as AppRole]?.color || 'outline';
}

/**
 * Get primary role from array of roles (highest priority)
 */
export function getPrimaryRole(roles: AppRole[]): AppRole | null {
  if (!roles || roles.length === 0) return null;
  
  return roles.reduce((primary, current) => {
    const primaryPriority = ROLE_CONFIG[primary]?.priority ?? 999;
    const currentPriority = ROLE_CONFIG[current]?.priority ?? 999;
    return currentPriority < primaryPriority ? current : primary;
  });
}

/**
 * Check if role is an admin role (admin or super_admin)
 */
export function isAdminRole(role: AppRole | string): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if role has higher priority than another
 */
export function hasHigherPriority(roleA: AppRole, roleB: AppRole): boolean {
  const priorityA = ROLE_CONFIG[roleA]?.priority ?? 999;
  const priorityB = ROLE_CONFIG[roleB]?.priority ?? 999;
  return priorityA < priorityB;
}

/**
 * Get all available roles for selection (e.g., in dropdowns)
 */
export function getAvailableRoles(): Array<{ value: AppRole; label: string; description: string }> {
  return Object.entries(ROLE_CONFIG)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([value, config]) => ({
      value: value as AppRole,
      label: config.label,
      description: config.description,
    }));
}
