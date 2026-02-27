// Shared Swiss date formatting for Edge Functions
// SSOT for timezone and date display across all email functions

import { format } from 'https://esm.sh/date-fns@3.6.0';
import { toZonedTime } from 'https://esm.sh/date-fns-tz@3.2.0';

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
