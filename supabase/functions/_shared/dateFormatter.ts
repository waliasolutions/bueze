// Shared Swiss date formatting and arithmetic for Edge Functions
// SSOT for timezone, date display, and date calculations across all functions

import { format, addMonths as dfnsAddMonths, addDays as dfnsAddDays } from 'https://esm.sh/date-fns@3.6.0';
import { toZonedTime, fromZonedTime } from 'https://esm.sh/date-fns-tz@3.2.0';

export const SWISS_TIMEZONE = 'Europe/Zurich';

/**
 * Format date/time in Swiss timezone (dd.MM.yyyy HH:mm)
 */
export function formatSwissDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const swissDate = toZonedTime(dateObj, SWISS_TIMEZONE);
  return format(swissDate, 'dd.MM.yyyy HH:mm', { timeZone: SWISS_TIMEZONE });
}

/**
 * Format date in Swiss timezone (dd.MM.yyyy)
 */
export function formatSwissDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const swissDate = toZonedTime(dateObj, SWISS_TIMEZONE);
  return format(swissDate, 'dd.MM.yyyy', { timeZone: SWISS_TIMEZONE });
}

/**
 * Format date in Swiss locale long form (e.g. "Montag, 15. März")
 */
export function formatSwissDateLong(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: SWISS_TIMEZONE,
  });
}

/**
 * Add days to a date — DST-safe via date-fns.
 * Returns a UTC Date that represents the correct Swiss wall-clock time.
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dfnsAddDays(dateObj, days);
}

/**
 * Add months to a date — DST-safe and handles month-end boundaries
 * (e.g. Jan 31 + 1 month = Feb 28, not Mar 3).
 * Returns a UTC Date.
 */
export function addMonths(date: Date | string, months: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dfnsAddMonths(dateObj, months);
}

/**
 * Get current Swiss time as a UTC Date
 */
export function nowSwiss(): Date {
  return toZonedTime(new Date(), SWISS_TIMEZONE);
}

/**
 * Get start of day (00:00:00) in Swiss timezone for a given date
 */
export function startOfDaySwiss(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const swiss = toZonedTime(dateObj, SWISS_TIMEZONE);
  swiss.setHours(0, 0, 0, 0);
  return fromZonedTime(swiss, SWISS_TIMEZONE);
}

/**
 * Get end of day (23:59:59.999) in Swiss timezone for a given date
 */
export function endOfDaySwiss(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const swiss = toZonedTime(dateObj, SWISS_TIMEZONE);
  swiss.setHours(23, 59, 59, 999);
  return fromZonedTime(swiss, SWISS_TIMEZONE);
}
