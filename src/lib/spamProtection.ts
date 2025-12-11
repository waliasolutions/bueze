/**
 * Spam protection utilities for form submissions
 * Includes honeypot, rate limiting, time-based checks, and content validation
 */

import { detectSpam, detectProfanity } from './reviewValidation';

export interface SpamCheckResult {
  isPassed: boolean;
  reason?: string;
}

/**
 * Validates honeypot field - must be empty (bots fill hidden fields)
 */
export function validateHoneypot(value: string): SpamCheckResult {
  if (value && value.length > 0) {
    return { isPassed: false, reason: 'Spam erkannt.' };
  }
  return { isPassed: true };
}

/**
 * Validates form submission time - must take at least minSeconds to fill
 */
export function validateSubmissionTime(startTime: number, minSeconds: number = 5): SpamCheckResult {
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  if (elapsedSeconds < minSeconds) {
    return { 
      isPassed: false, 
      reason: 'Formular zu schnell ausgefüllt. Bitte nehmen Sie sich etwas mehr Zeit.' 
    };
  }
  return { isPassed: true };
}

/**
 * Checks rate limit for submissions using sessionStorage
 */
export function checkRateLimit(
  key: string, 
  maxAttempts: number = 3, 
  windowMs: number = 60000
): SpamCheckResult {
  const storageKey = `spam_${key}`;
  const now = Date.now();
  
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) {
      return { isPassed: true };
    }
    
    const attempts: number[] = JSON.parse(stored);
    // Filter to only attempts within the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      const waitSeconds = Math.ceil((windowMs - (now - recentAttempts[0])) / 1000);
      return { 
        isPassed: false, 
        reason: `Zu viele Versuche. Bitte warten Sie ${waitSeconds} Sekunden.` 
      };
    }
    
    return { isPassed: true };
  } catch {
    // If sessionStorage fails, allow the attempt
    return { isPassed: true };
  }
}

/**
 * Records a submission attempt for rate limiting
 */
export function recordAttempt(key: string): void {
  const storageKey = `spam_${key}`;
  const now = Date.now();
  
  try {
    const stored = sessionStorage.getItem(storageKey);
    const attempts: number[] = stored ? JSON.parse(stored) : [];
    
    // Add current attempt
    attempts.push(now);
    
    // Keep only last 10 attempts to prevent storage bloat
    const trimmed = attempts.slice(-10);
    
    sessionStorage.setItem(storageKey, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Validates lead content for spam patterns and profanity
 */
export function validateLeadContent(title: string, description: string): SpamCheckResult {
  // Check title for spam
  const titleSpamCheck = detectSpam(title);
  if (titleSpamCheck.isSpam) {
    return { isPassed: false, reason: `Titel: ${titleSpamCheck.reason}` };
  }
  
  // Check description for spam
  const descSpamCheck = detectSpam(description);
  if (descSpamCheck.isSpam) {
    return { isPassed: false, reason: `Beschreibung: ${descSpamCheck.reason}` };
  }
  
  // Check for profanity in title
  const titleProfanity = detectProfanity(title);
  if (titleProfanity.hasProfanity) {
    return { isPassed: false, reason: 'Bitte verwenden Sie keine anstössige Sprache im Titel.' };
  }
  
  // Check for profanity in description
  const descProfanity = detectProfanity(description);
  if (descProfanity.hasProfanity) {
    return { isPassed: false, reason: 'Bitte verwenden Sie keine anstössige Sprache in der Beschreibung.' };
  }
  
  return { isPassed: true };
}

/**
 * Runs all spam protection checks
 */
export function runAllSpamChecks(params: {
  honeypotValue: string;
  formLoadTime: number;
  rateLimitKey: string;
  title: string;
  description: string;
  minSubmitTimeSeconds?: number;
  maxAttemptsPerMinute?: number;
}): SpamCheckResult {
  // 1. Check honeypot
  const honeypotCheck = validateHoneypot(params.honeypotValue);
  if (!honeypotCheck.isPassed) {
    return honeypotCheck;
  }
  
  // 2. Check submission time
  const timeCheck = validateSubmissionTime(
    params.formLoadTime, 
    params.minSubmitTimeSeconds ?? 5
  );
  if (!timeCheck.isPassed) {
    return timeCheck;
  }
  
  // 3. Check rate limit
  const rateCheck = checkRateLimit(
    params.rateLimitKey, 
    params.maxAttemptsPerMinute ?? 3
  );
  if (!rateCheck.isPassed) {
    return rateCheck;
  }
  
  // 4. Check content
  const contentCheck = validateLeadContent(params.title, params.description);
  if (!contentCheck.isPassed) {
    return contentCheck;
  }
  
  return { isPassed: true };
}
