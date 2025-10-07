/**
 * Swiss Timezone Utility
 * Single Source of Truth for all timezone-related operations
 * Ensures consistent handling of Swiss timezone (Europe/Zurich / CET/CEST)
 */

import { format as dateFnsFormat, formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { de } from 'date-fns/locale';

export const SWISS_TIMEZONE = 'Europe/Zurich';

/**
 * Convert any date to Swiss timezone
 */
export function toSwissTime(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return toZonedTime(dateObj, SWISS_TIMEZONE);
}

/**
 * Convert Swiss time to UTC for database storage
 */
export function fromSwissTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return fromZonedTime(dateObj, SWISS_TIMEZONE);
}

/**
 * Format date in Swiss timezone with custom format
 * @param date - Date to format
 * @param formatString - Format string (e.g., 'dd.MM.yyyy', 'HH:mm', 'PPP')
 * @returns Formatted date string
 */
export function formatSwissDate(date: Date | string | number, formatString: string = 'dd.MM.yyyy'): string {
  const swissDate = toSwissTime(date);
  return dateFnsFormat(swissDate, formatString, { locale: de });
}

/**
 * Format date in Swiss locale (short format: dd.MM.yyyy)
 */
export function formatDate(date: Date | string | number): string {
  return formatSwissDate(date, 'dd.MM.yyyy');
}

/**
 * Format datetime in Swiss locale (dd.MM.yyyy HH:mm)
 */
export function formatDateTime(date: Date | string | number): string {
  return formatSwissDate(date, 'dd.MM.yyyy HH:mm');
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(date: Date | string | number): string {
  return formatSwissDate(date, 'HH:mm');
}

/**
 * Format date as "Heute", "Gestern", or date
 */
export function formatDateRelative(date: Date | string | number): string {
  const swissDate = toSwissTime(date);
  const today = toSwissTime(new Date());
  const daysDiff = differenceInDays(today, swissDate);

  if (daysDiff === 0) return 'Heute';
  if (daysDiff === 1) return 'Gestern';
  return formatDate(swissDate);
}

/**
 * Format time ago (e.g., "vor 2 Stunden", "vor 3 Tagen")
 */
export function formatTimeAgo(date: Date | string | number): string {
  const swissDate = toSwissTime(date);
  const now = toSwissTime(new Date());
  const diffInHours = differenceInHours(now, swissDate);

  if (diffInHours < 1) return 'Gerade eben';
  if (diffInHours < 24) return `vor ${diffInHours} Std.`;
  
  const days = Math.floor(diffInHours / 24);
  if (days === 1) return 'vor 1 Tag';
  if (days < 7) return `vor ${days} Tagen`;
  if (days < 30) return `vor ${Math.floor(days / 7)} Wochen`;
  if (days < 365) return `vor ${Math.floor(days / 30)} Monaten`;
  return `vor ${Math.floor(days / 365)} Jahren`;
}

/**
 * Get current date/time in Swiss timezone
 */
export function now(): Date {
  return toSwissTime(new Date());
}

/**
 * Get start of month in Swiss timezone
 */
export function startOfMonth(date?: Date | string): Date {
  const d = date ? toSwissTime(date) : now();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Get end of month in Swiss timezone
 */
export function endOfMonth(date?: Date | string): Date {
  const d = date ? toSwissTime(date) : now();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Add months to a date
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = toSwissTime(date);
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  return toSwissTime(date) < now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  return toSwissTime(date) > now();
}

/**
 * Format currency in Swiss format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(amount);
}

/**
 * Format number in Swiss format
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-CH').format(value);
}
